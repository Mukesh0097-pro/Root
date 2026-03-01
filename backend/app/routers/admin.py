import json
import secrets
import uuid as uuid_mod
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.db import User, Department, Document, ChatMessage, AuditLog, Conversation, AccessRequest, DocumentACL
from ..models.schemas import (
    DashboardResponse, InviteUserRequest, InviteUserResponse,
    UpdateUserRequest, UserResponse, AnalyticsResponse, DocumentUpdateRequest, DocumentResponse,
)
from ..auth.dependencies import get_current_user, require_role
from ..auth.jwt import hash_password
from ..services.audit import log_action

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    department_id: uuid_mod.UUID = Query(...),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Queries today
    queries_result = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= today_start,
        )
    )
    queries_today = queries_result.scalar() or 0

    # Total documents
    docs_result = await db.execute(
        select(func.count()).select_from(Document).where(
            Document.department_id == department_id,
            Document.status == "ready",
        )
    )
    total_documents = docs_result.scalar() or 0

    # Active users (logged in within 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    users_result = await db.execute(
        select(func.count()).select_from(User).where(
            User.department_id == department_id,
            User.is_active == True,
            User.last_login >= thirty_days_ago,
        )
    )
    active_users = users_result.scalar() or 0

    # Satisfaction
    up_result = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.feedback == "up",
        )
    )
    up_count = up_result.scalar() or 0

    down_result = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.feedback == "down",
        )
    )
    down_count = down_result.scalar() or 0

    total_feedback = up_count + down_count
    satisfaction_pct = round((up_count / total_feedback * 100), 1) if total_feedback > 0 else 100.0

    # Recent activity
    activity_result = await db.execute(
        select(AuditLog)
        .where(AuditLog.department_id == department_id)
        .order_by(desc(AuditLog.created_at))
        .limit(20)
    )
    activity_logs = activity_result.scalars().all()

    recent_activity = []
    for log in activity_logs:
        user_result = await db.execute(select(User).where(User.id == log.user_id))
        user = user_result.scalar_one_or_none()
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        recent_activity.append({
            "action": log.action,
            "user_name": user_name,
            "resource": f"{log.resource_type}/{log.resource_id}" if log.resource_id else log.resource_type,
            "timestamp": log.created_at.isoformat(),
        })

    return DashboardResponse(
        queries_today=queries_today,
        total_documents=total_documents,
        active_users=active_users,
        satisfaction_pct=satisfaction_pct,
        recent_activity=recent_activity,
    )


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    department_id: uuid_mod.UUID = Query(...),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.department_id == department_id).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    dept_result = await db.execute(select(Department).where(Department.id == department_id))
    dept = dept_result.scalar_one_or_none()
    dept_name = dept.name if dept else None

    return [
        UserResponse(
            id=u.id, email=u.email, first_name=u.first_name, last_name=u.last_name,
            role=u.role, department_id=u.department_id, department_name=dept_name,
            is_active=u.is_active, created_at=u.created_at, last_login=u.last_login,
        )
        for u in users
    ]


@router.post("/users/invite", response_model=InviteUserResponse)
async def invite_user(
    req: InviteUserRequest,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if req.role not in ("employee", "dept_admin"):
        raise HTTPException(status_code=400, detail="Can only invite employees or department admins")

    # Dept admins can only invite to their own department
    if current_user.role == "dept_admin" and req.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot invite users to other departments")

    temp_password = secrets.token_urlsafe(12)

    user = User(
        email=req.email,
        password_hash=hash_password(temp_password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=req.role,
        department_id=req.department_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    dept_result = await db.execute(select(Department).where(Department.id == req.department_id))
    dept = dept_result.scalar_one_or_none()

    await log_action(
        db, current_user.id, req.department_id,
        "user_invite", "user", str(user.id),
        details={"email": req.email, "role": req.role},
    )

    return InviteUserResponse(
        user=UserResponse(
            id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name,
            role=user.role, department_id=user.department_id,
            department_name=dept.name if dept else None,
            is_active=user.is_active, created_at=user.created_at, last_login=user.last_login,
        ),
        temp_password=temp_password,
    )


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid_mod.UUID,
    req: UpdateUserRequest,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Dept admin can only manage their department
    if current_user.role == "dept_admin" and user.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot manage users in other departments")

    # Only company admin can change roles
    if req.role is not None:
        if current_user.role != "company_admin":
            raise HTTPException(status_code=403, detail="Only company admins can change roles")
        if req.role not in ("employee", "dept_admin", "company_admin"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = req.role

    if req.is_active is not None:
        user.is_active = req.is_active

    await db.commit()
    await db.refresh(user)

    dept_result = await db.execute(select(Department).where(Department.id == user.department_id))
    dept = dept_result.scalar_one_or_none()

    await log_action(
        db, current_user.id, user.department_id,
        "user_update", "user", str(user_id),
    )

    return UserResponse(
        id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name,
        role=user.role, department_id=user.department_id,
        department_name=dept.name if dept else None,
        is_active=user.is_active, created_at=user.created_at, last_login=user.last_login,
    )


@router.post("/users/{user_id}/resend-invite")
async def resend_invite(
    user_id: uuid_mod.UUID,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Resend invitation by generating a new temporary password."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "dept_admin" and user.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot manage users in other departments")

    # Only resend to users who never logged in
    if user.last_login is not None:
        raise HTTPException(status_code=400, detail="User has already logged in")

    temp_password = secrets.token_urlsafe(12)
    user.password_hash = hash_password(temp_password)
    await db.commit()

    await log_action(
        db, current_user.id, user.department_id,
        "user_resend_invite", "user", str(user_id),
    )

    return {"temp_password": temp_password}


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    department_id: uuid_mod.UUID = Query(...),
    period: str = Query("30d"),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Query volume per day
    from sqlalchemy import cast, Date
    volume_result = await db.execute(
        select(
            cast(ChatMessage.created_at, Date).label("date"),
            func.count().label("count"),
        )
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_date,
        )
        .group_by(cast(ChatMessage.created_at, Date))
        .order_by(cast(ChatMessage.created_at, Date))
    )
    query_volume = [{"date": str(r.date), "count": r.count} for r in volume_result]

    # Top queries
    top_result = await db.execute(
        select(ChatMessage.content, func.count().label("count"))
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_date,
        )
        .group_by(ChatMessage.content)
        .order_by(desc("count"))
        .limit(10)
    )
    top_queries = [{"query": r.content[:100], "count": r.count} for r in top_result]

    # Satisfaction
    up = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.feedback == "up",
            ChatMessage.created_at >= start_date,
        )
    )
    down = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.feedback == "down",
            ChatMessage.created_at >= start_date,
        )
    )
    total_msgs = await db.execute(
        select(func.count()).select_from(ChatMessage).join(Conversation).where(
            Conversation.department_id == department_id,
            ChatMessage.role == "assistant",
            ChatMessage.created_at >= start_date,
        )
    )
    up_val = up.scalar() or 0
    down_val = down.scalar() or 0
    total_val = total_msgs.scalar() or 0
    neutral_val = total_val - up_val - down_val

    # Avg response time from stored measurements
    rt_result = await db.execute(
        select(func.avg(ChatMessage.response_time_ms))
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "assistant",
            ChatMessage.response_time_ms != None,
            ChatMessage.created_at >= start_date,
        )
    )
    avg_rt_ms = rt_result.scalar() or 0
    avg_response_time = round(avg_rt_ms / 1000, 1) if avg_rt_ms else 2.3

    # Documents by status
    status_result = await db.execute(
        select(Document.status, func.count().label("count"))
        .where(Document.department_id == department_id)
        .group_by(Document.status)
    )
    docs_by_status = {r.status: r.count for r in status_result}

    # Active users trend
    users_trend_result = await db.execute(
        select(
            cast(User.last_login, Date).label("date"),
            func.count(func.distinct(User.id)).label("count"),
        )
        .where(
            User.department_id == department_id,
            User.last_login >= start_date,
            User.last_login != None,
        )
        .group_by(cast(User.last_login, Date))
        .order_by(cast(User.last_login, Date))
    )
    active_users_trend = [{"date": str(r.date), "count": r.count} for r in users_trend_result]

    return AnalyticsResponse(
        query_volume=query_volume,
        top_queries=top_queries,
        satisfaction={"up": up_val, "down": down_val, "neutral": max(neutral_val, 0)},
        avg_response_time=avg_response_time,
        documents_by_status=docs_by_status,
        active_users_trend=active_users_trend,
    )


@router.get("/knowledge-gaps")
async def get_knowledge_gaps(
    department_id: uuid_mod.UUID = Query(...),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return queries with low confidence scores, indicating knowledge gaps."""
    result = await db.execute(
        select(ChatMessage.content, ChatMessage.confidence, ChatMessage.created_at)
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "assistant",
            ChatMessage.confidence != None,
            ChatMessage.confidence < 50,
        )
        .order_by(ChatMessage.confidence.asc())
        .limit(20)
    )
    gaps = [
        {
            "query": r.content[:150],
            "confidence": round(r.confidence, 1) if r.confidence else 0,
            "timestamp": r.created_at.isoformat(),
        }
        for r in result
    ]
    return gaps


@router.get("/analytics/export")
async def export_analytics_csv(
    department_id: uuid_mod.UUID = Query(...),
    period: str = Query("30d"),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Export analytics data as CSV."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    from sqlalchemy import cast, Date

    # Query volume
    volume_result = await db.execute(
        select(
            cast(ChatMessage.created_at, Date).label("date"),
            func.count().label("count"),
        )
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_date,
        )
        .group_by(cast(ChatMessage.created_at, Date))
        .order_by(cast(ChatMessage.created_at, Date))
    )
    volume_rows = list(volume_result)

    # Top queries
    top_result = await db.execute(
        select(ChatMessage.content, func.count().label("count"))
        .join(Conversation)
        .where(
            Conversation.department_id == department_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_date,
        )
        .group_by(ChatMessage.content)
        .order_by(desc("count"))
        .limit(20)
    )
    top_rows = list(top_result)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Query Volume by Date"])
    writer.writerow(["Date", "Count"])
    for r in volume_rows:
        writer.writerow([str(r.date), r.count])
    writer.writerow([])

    writer.writerow(["Top Queries"])
    writer.writerow(["Query", "Count"])
    for r in top_rows:
        writer.writerow([r.content[:200], r.count])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analytics_{period}.csv"},
    )


@router.patch("/documents/{document_id}")
async def update_document_metadata(
    document_id: uuid_mod.UUID,
    req: DocumentUpdateRequest,
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == "dept_admin" and doc.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot modify documents in other departments")

    if req.title is not None:
        doc.title = req.title
    if req.description is not None:
        doc.description = req.description
    if req.category is not None:
        doc.category = req.category
    if req.tags is not None:
        doc.tags = req.tags

    await db.commit()
    return {"status": "ok"}


@router.get("/company/dashboard")
async def get_company_dashboard(
    current_user: User = Depends(require_role("company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Company-wide dashboard for company admins."""
    # Total departments
    dept_count = await db.execute(select(func.count()).select_from(Department))
    total_departments = dept_count.scalar() or 0

    # Total users
    user_count = await db.execute(select(func.count()).select_from(User))
    total_users = user_count.scalar() or 0

    # Total documents
    doc_count = await db.execute(
        select(func.count()).select_from(Document).where(Document.status == "ready")
    )
    total_documents = doc_count.scalar() or 0

    # Total queries (all time)
    query_count = await db.execute(
        select(func.count()).select_from(ChatMessage).where(ChatMessage.role == "user")
    )
    total_queries = query_count.scalar() or 0

    # Department breakdown
    departments = []
    dept_result = await db.execute(select(Department).order_by(Department.name))
    for dept in dept_result.scalars().all():
        dept_users = await db.execute(
            select(func.count()).select_from(User).where(User.department_id == dept.id)
        )
        dept_docs = await db.execute(
            select(func.count()).select_from(Document).where(
                Document.department_id == dept.id, Document.status == "ready"
            )
        )
        departments.append({
            "id": str(dept.id),
            "name": dept.name,
            "code": dept.code,
            "user_count": dept_users.scalar() or 0,
            "document_count": dept_docs.scalar() or 0,
        })

    return {
        "total_departments": total_departments,
        "total_users": total_users,
        "total_documents": total_documents,
        "total_queries": total_queries,
        "departments": departments,
    }


@router.post("/departments")
async def create_department(
    name: str = Query(...),
    code: str = Query(...),
    description: Optional[str] = Query(None),
    current_user: User = Depends(require_role("company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new department (company_admin only)."""
    # Check for duplicate code
    existing = await db.execute(select(Department).where(Department.code == code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists")

    dept = Department(
        name=name,
        code=code,
        description=description,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)

    await log_action(
        db, current_user.id, dept.id,
        "department_create", "department", str(dept.id),
        details={"name": name, "code": code},
    )

    return {
        "id": str(dept.id),
        "name": dept.name,
        "code": dept.code,
        "description": dept.description,
    }


@router.post("/users/import-csv")
async def import_users_csv(
    file: UploadFile = File(...),
    department_id: uuid_mod.UUID = Query(...),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk import users from a CSV file.
    Expected CSV columns: email, first_name, last_name, role (optional, defaults to 'employee')
    Returns created users with temporary passwords.
    """
    import csv
    import io

    if current_user.role == "dept_admin" and department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot import users to other departments")

    # Validate department exists
    dept_result = await db.execute(select(Department).where(Department.id == department_id))
    dept = dept_result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handle BOM
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded CSV")

    reader = csv.DictReader(io.StringIO(text))

    required_fields = {"email", "first_name", "last_name"}
    if not reader.fieldnames or not required_fields.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(required_fields)}. Found: {reader.fieldnames}",
        )

    results = []
    errors = []
    row_num = 1

    for row in reader:
        row_num += 1
        email = (row.get("email") or "").strip().lower()
        first_name = (row.get("first_name") or "").strip()
        last_name = (row.get("last_name") or "").strip()
        role = (row.get("role") or "employee").strip().lower()

        if not email or not first_name or not last_name:
            errors.append({"row": row_num, "error": "Missing required fields", "email": email})
            continue

        if role not in ("employee", "dept_admin"):
            role = "employee"

        # Check duplicate
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            errors.append({"row": row_num, "error": "Email already registered", "email": email})
            continue

        temp_password = secrets.token_urlsafe(12)
        user = User(
            email=email,
            password_hash=hash_password(temp_password),
            first_name=first_name,
            last_name=last_name,
            role=role,
            department_id=department_id,
        )
        db.add(user)
        await db.flush()

        results.append({
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "temp_password": temp_password,
        })

    await db.commit()

    await log_action(
        db, current_user.id, department_id,
        "users_csv_import", "user", None,
        details={"imported": len(results), "errors": len(errors)},
    )

    return {
        "imported": len(results),
        "errors": errors,
        "users": results,
    }


# --- Cross-Department Access Request Endpoints ---

@router.post("/access-requests")
async def create_access_request(
    target_department_id: uuid_mod.UUID = Query(...),
    document_id: Optional[uuid_mod.UUID] = Query(None),
    reason: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request access to another department's documents."""
    if target_department_id == current_user.department_id:
        raise HTTPException(status_code=400, detail="Cannot request access to your own department")

    # Check department exists
    dept_result = await db.execute(select(Department).where(Department.id == target_department_id))
    if not dept_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Department not found")

    # Check for duplicate pending request
    existing = await db.execute(
        select(AccessRequest).where(
            AccessRequest.requester_id == current_user.id,
            AccessRequest.target_department_id == target_department_id,
            AccessRequest.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a pending request for this department")

    request = AccessRequest(
        requester_id=current_user.id,
        document_id=document_id,
        target_department_id=target_department_id,
        reason=reason,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)

    await log_action(
        db, current_user.id, current_user.department_id,
        "access_request_create", "access_request", str(request.id),
        details={"target_dept": str(target_department_id)},
    )

    return {
        "id": str(request.id),
        "status": request.status,
        "target_department_id": str(request.target_department_id),
    }


@router.get("/access-requests")
async def list_access_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """List access requests for the admin's department(s)."""
    query = select(AccessRequest)

    if current_user.role == "dept_admin":
        query = query.where(AccessRequest.target_department_id == current_user.department_id)
    # company_admin sees all

    if status_filter:
        query = query.where(AccessRequest.status == status_filter)

    query = query.order_by(AccessRequest.created_at.desc())
    result = await db.execute(query)
    requests = result.scalars().all()

    items = []
    for req in requests:
        user_result = await db.execute(select(User).where(User.id == req.requester_id))
        requester = user_result.scalar_one_or_none()
        dept_result = await db.execute(select(Department).where(Department.id == req.target_department_id))
        target_dept = dept_result.scalar_one_or_none()

        items.append({
            "id": str(req.id),
            "requester_email": requester.email if requester else "unknown",
            "requester_name": f"{requester.first_name} {requester.last_name}" if requester else "Unknown",
            "target_department": target_dept.name if target_dept else "Unknown",
            "document_id": str(req.document_id) if req.document_id else None,
            "reason": req.reason,
            "status": req.status,
            "created_at": req.created_at.isoformat(),
        })

    return items


@router.patch("/access-requests/{request_id}")
async def review_access_request(
    request_id: uuid_mod.UUID,
    action: str = Query(...),  # "approve" or "deny"
    current_user: User = Depends(require_role("dept_admin", "company_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Approve or deny an access request."""
    if action not in ("approve", "deny"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'deny'")

    result = await db.execute(select(AccessRequest).where(AccessRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Access request not found")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request has already been reviewed")

    if current_user.role == "dept_admin" and request.target_department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot review requests for other departments")

    request.status = "approved" if action == "approve" else "denied"
    request.reviewed_by = current_user.id
    request.reviewed_at = datetime.now(timezone.utc)

    # If approved and document_id specified, create ACL entry
    if action == "approve" and request.document_id:
        acl_entry = DocumentACL(
            document_id=request.document_id,
            user_id=request.requester_id,
            permission="read",
            granted_by=current_user.id,
        )
        db.add(acl_entry)

    await db.commit()

    await log_action(
        db, current_user.id, request.target_department_id,
        f"access_request_{action}", "access_request", str(request_id),
    )

    return {"status": "ok", "request_status": request.status}
