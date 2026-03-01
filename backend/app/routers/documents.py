import json
import tempfile
import uuid as uuid_mod
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db, async_session
from ..models.db import User, Document, DocumentACL
from ..models.schemas import DocumentResponse
from ..auth.dependencies import get_current_user, require_role
from ..config import settings
from ..services.document_processor import DocumentProcessor
from ..services.chunker import RecursiveChunker
from ..services.embeddings import EmbeddingService
from ..services.vector_store import vector_store
from ..services.storage import storage_service
from ..services.audit import log_action

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_TYPES = {"pdf", "docx", "xlsx", "csv", "txt", "md", "png", "jpg", "jpeg"}


async def process_document_task(document_id: str, stored_filename: str, file_type: str, department_id: str, title: str):
    """Background task to process uploaded document."""
    processor = DocumentProcessor()
    chunker = RecursiveChunker()
    embeddings = EmbeddingService()

    async with async_session() as db:
        try:
            # Get a local file path for the processor
            # If using S3, download to a temp file first
            if storage_service.is_local:
                file_path = storage_service.get_file_path(stored_filename)
            else:
                file_data = await storage_service.read_file(stored_filename)
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_type}")
                tmp.write(file_data)
                tmp.close()
                file_path = tmp.name

            try:
                # Extract text
                text = await processor.extract_text(file_path, file_type)
            finally:
                # Clean up temp file if we created one
                if not storage_service.is_local:
                    Path(file_path).unlink(missing_ok=True)

            if not text.strip():
                result = await db.execute(select(Document).where(Document.id == uuid_mod.UUID(document_id)))
                doc = result.scalar_one()
                doc.status = "error"
                doc.error_message = "No text could be extracted from this file"
                await db.commit()
                return

            # Chunk text
            chunks = chunker.chunk(text, document_id, title)

            # Embed chunks
            chunk_texts = [c.text for c in chunks]
            vectors = await embeddings.embed_documents(chunk_texts)

            # Build metadata for FAISS
            chunk_metadata = [
                {
                    "text": c.text,
                    "document_id": c.document_id,
                    "document_title": c.document_title,
                    "page_number": c.page_number,
                    "chunk_index": c.index,
                }
                for c in chunks
            ]

            # Add to FAISS
            vector_store.add_vectors(department_id, vectors, chunk_metadata)

            # Update document status
            result = await db.execute(select(Document).where(Document.id == uuid_mod.UUID(document_id)))
            doc = result.scalar_one()
            doc.status = "ready"
            doc.chunk_count = len(chunks)
            await db.commit()

        except Exception as e:
            result = await db.execute(select(Document).where(Document.id == uuid_mod.UUID(document_id)))
            doc = result.scalar_one_or_none()
            if doc:
                doc.status = "error"
                doc.error_message = str(e)[:500]
                await db.commit()


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    category: str = Form(None),
    tags: str = Form(None),
    department_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Allowed: {', '.join(ALLOWED_TYPES)}")

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")

    # Save file via storage service
    stored_filename = f"{uuid_mod.uuid4()}.{ext}"
    await storage_service.save_file(stored_filename, content)

    # Create document record
    doc = Document(
        department_id=uuid_mod.UUID(department_id),
        uploaded_by=current_user.id,
        filename=stored_filename,
        original_name=file.filename,
        file_type=ext,
        file_size=len(content),
        title=title,
        description=description,
        category=category,
        tags=tags,
        status="processing",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Start background processing
    background_tasks.add_task(
        process_document_task,
        str(doc.id), stored_filename, ext, department_id, title,
    )

    await log_action(
        db, current_user.id, uuid_mod.UUID(department_id),
        "document_upload", "document", str(doc.id),
        details={"filename": file.filename, "file_type": ext},
    )

    return _doc_to_response(doc)


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    department_id: uuid_mod.UUID = Query(...),
    status: str = Query(None),
    search: str = Query(None),
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.department_id == department_id)
    if not include_archived:
        query = query.where(Document.is_archived == False)
    if status:
        query = query.where(Document.status == status)
    if search:
        query = query.where(Document.title.ilike(f"%{search}%"))
    query = query.order_by(Document.created_at.desc())

    result = await db.execute(query)
    documents = result.scalars().all()
    return [_doc_to_response(d) for d in documents]


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_response(doc)


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Only admins or the uploader can delete
    if current_user.role == "employee" and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only admins can delete documents")

    # Remove from FAISS
    vector_store.remove_document(str(doc.department_id), str(doc.id))

    # Delete file from storage
    await storage_service.delete_file(doc.filename)

    await db.delete(doc)
    await db.commit()

    await log_action(
        db, current_user.id, doc.department_id,
        "document_delete", "document", str(document_id),
    )

    return {"status": "ok"}


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download the original uploaded file."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    media_type_map = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
        "txt": "text/plain",
        "md": "text/markdown",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
    }
    media_type = media_type_map.get(doc.file_type, "application/octet-stream")

    # For local storage, use FileResponse; for S3, read bytes
    if storage_service.is_local:
        file_path = storage_service.get_file_path(doc.filename)
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail="File not found on server")
        return FileResponse(
            path=file_path,
            filename=doc.original_name,
            media_type=media_type,
        )
    else:
        try:
            file_data = await storage_service.read_file(doc.filename)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="File not found in storage")
        return Response(
            content=file_data,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{doc.original_name}"'},
        )


@router.patch("/documents/{document_id}/archive")
async def archive_document(
    document_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive a document (soft delete)."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "employee" and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only admins can archive documents")

    doc.is_archived = not doc.is_archived
    await db.commit()

    action = "document_archive" if doc.is_archived else "document_unarchive"
    await log_action(
        db, current_user.id, doc.department_id,
        action, "document", str(document_id),
    )

    return {"status": "ok", "is_archived": doc.is_archived}


@router.post("/documents/{document_id}/replace", response_model=DocumentResponse)
async def replace_document(
    document_id: uuid_mod.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Replace a document with a new version. Archives the old version and re-indexes."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    old_doc = result.scalar_one_or_none()
    if not old_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "employee" and old_doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only admins or the uploader can replace documents")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")

    # Save new file via storage service
    stored_filename = f"{uuid_mod.uuid4()}.{ext}"
    await storage_service.save_file(stored_filename, content)

    # Archive old document and remove from vector store
    old_doc.is_archived = True
    vector_store.remove_document(str(old_doc.department_id), str(old_doc.id))

    new_version = old_doc.version + 1

    # Create new document record
    new_doc = Document(
        department_id=old_doc.department_id,
        uploaded_by=current_user.id,
        filename=stored_filename,
        original_name=file.filename or old_doc.original_name,
        file_type=ext,
        file_size=len(content),
        title=old_doc.title,
        description=old_doc.description,
        category=old_doc.category,
        tags=old_doc.tags,
        status="processing",
        version=new_version,
    )
    db.add(new_doc)
    await db.flush()

    old_doc.replaced_by = new_doc.id
    await db.commit()
    await db.refresh(new_doc)

    # Start background processing
    background_tasks.add_task(
        process_document_task,
        str(new_doc.id), stored_filename, ext, str(old_doc.department_id), old_doc.title,
    )

    await log_action(
        db, current_user.id, old_doc.department_id,
        "document_replace", "document", str(new_doc.id),
        details={"old_id": str(document_id), "version": new_version},
    )

    return _doc_to_response(new_doc)


def _doc_to_response(doc: Document) -> DocumentResponse:
    tags = []
    if doc.tags:
        try:
            tags = json.loads(doc.tags)
        except json.JSONDecodeError:
            tags = [t.strip() for t in doc.tags.split(",") if t.strip()]

    return DocumentResponse(
        id=doc.id,
        department_id=doc.department_id,
        uploaded_by=doc.uploaded_by,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        title=doc.title,
        description=doc.description,
        category=doc.category,
        tags=tags,
        status=doc.status,
        chunk_count=doc.chunk_count,
        error_message=doc.error_message,
        is_archived=doc.is_archived,
        created_at=doc.created_at,
    )


# --- Document ACL Endpoints ---

@router.get("/documents/{document_id}/acl")
async def get_document_acl(
    document_id: uuid_mod.UUID,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get access control list for a document."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "dept_admin" and doc.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot view ACL for documents in other departments")

    acl_result = await db.execute(
        select(DocumentACL).where(DocumentACL.document_id == document_id)
    )
    acl_entries = acl_result.scalars().all()

    entries = []
    for entry in acl_entries:
        user_result = await db.execute(select(User).where(User.id == entry.user_id))
        user = user_result.scalar_one_or_none()
        entries.append({
            "id": str(entry.id),
            "user_id": str(entry.user_id),
            "user_email": user.email if user else "unknown",
            "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
            "permission": entry.permission,
            "created_at": entry.created_at.isoformat(),
        })

    return {"document_id": str(document_id), "acl": entries, "is_restricted": len(entries) > 0}


@router.post("/documents/{document_id}/acl")
async def add_document_acl(
    document_id: uuid_mod.UUID,
    user_id: uuid_mod.UUID = Query(...),
    permission: str = Query("read"),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Grant a user access to a document."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "dept_admin" and doc.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot modify ACL for documents in other departments")

    if permission not in ("read", "write"):
        raise HTTPException(status_code=400, detail="Permission must be 'read' or 'write'")

    # Check if ACL entry already exists
    existing = await db.execute(
        select(DocumentACL).where(
            DocumentACL.document_id == document_id,
            DocumentACL.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already has access to this document")

    acl_entry = DocumentACL(
        document_id=document_id,
        user_id=user_id,
        permission=permission,
        granted_by=current_user.id,
    )
    db.add(acl_entry)
    await db.commit()

    await log_action(
        db, current_user.id, doc.department_id,
        "document_acl_grant", "document", str(document_id),
        details={"user_id": str(user_id), "permission": permission},
    )

    return {"status": "ok"}


@router.delete("/documents/{document_id}/acl/{acl_id}")
async def remove_document_acl(
    document_id: uuid_mod.UUID,
    acl_id: uuid_mod.UUID,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a user's access to a document."""
    result = await db.execute(
        select(DocumentACL).where(DocumentACL.id == acl_id, DocumentACL.document_id == document_id)
    )
    acl_entry = result.scalar_one_or_none()
    if not acl_entry:
        raise HTTPException(status_code=404, detail="ACL entry not found")

    doc_result = await db.execute(select(Document).where(Document.id == document_id))
    doc = doc_result.scalar_one_or_none()

    if current_user.role == "dept_admin" and doc and doc.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot modify ACL for documents in other departments")

    await db.delete(acl_entry)
    await db.commit()

    await log_action(
        db, current_user.id, doc.department_id if doc else None,
        "document_acl_revoke", "document", str(document_id),
        details={"acl_id": str(acl_id)},
    )

    return {"status": "ok"}
