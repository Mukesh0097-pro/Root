import json
import uuid as uuid_mod
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db, async_session
from ..models.db import User, Document
from ..models.schemas import DocumentResponse
from ..auth.dependencies import get_current_user
from ..config import settings
from ..services.document_processor import DocumentProcessor
from ..services.chunker import RecursiveChunker
from ..services.embeddings import EmbeddingService
from ..services.vector_store import vector_store
from ..services.audit import log_action

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_TYPES = {"pdf", "docx", "xlsx", "csv", "txt", "md", "png", "jpg", "jpeg"}


async def process_document_task(document_id: str, file_path: str, file_type: str, department_id: str, title: str):
    """Background task to process uploaded document."""
    processor = DocumentProcessor()
    chunker = RecursiveChunker()
    embeddings = EmbeddingService()

    async with async_session() as db:
        try:
            # Extract text
            text = await processor.extract_text(file_path, file_type)
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

    # Save file
    stored_filename = f"{uuid_mod.uuid4()}.{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / stored_filename

    with open(file_path, "wb") as f:
        f.write(content)

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
        str(doc.id), str(file_path), ext, department_id, title,
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.department_id == department_id)
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

    # Delete file
    file_path = Path(settings.UPLOAD_DIR) / doc.filename
    if file_path.exists():
        file_path.unlink()

    await db.delete(doc)
    await db.commit()

    await log_action(
        db, current_user.id, doc.department_id,
        "document_delete", "document", str(document_id),
    )

    return {"status": "ok"}


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
        created_at=doc.created_at,
    )
