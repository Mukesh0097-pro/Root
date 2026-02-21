import json
import secrets
import uuid as uuid_mod
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.db import User, Department, Document, ChatMessage, AuditLog, Conversation
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

    # Avg response time (approximation — not tracked directly in MVP)
    avg_response_time = 2.3

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
