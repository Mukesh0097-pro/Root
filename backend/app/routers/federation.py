"""Federation management endpoints for building department profiles
and monitoring federated search status."""

import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.db import User, Department
from ..auth.dependencies import get_current_user
from ..services.federated_router import federated_router
from ..services.audit import log_action

router = APIRouter()


@router.post("/federation/build-profiles")
async def build_all_profiles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Build/refresh federation profiles for all departments.
    Only accessible by company admins."""
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Company admin access required")

    result = await db.execute(select(Department))
    departments = result.scalars().all()

    profiles = []
    for dept in departments:
        profile = federated_router.build_department_profile(
            department_id=str(dept.id),
            department_name=dept.name,
        )
        profiles.append(profile.to_dict())

    await log_action(
        db, current_user.id, None,
        "build_federation_profiles", "federation", None,
        details={"departments_profiled": len(profiles)},
    )

    return {
        "status": "ok",
        "profiles_built": len(profiles),
        "profiles": profiles,
    }


@router.post("/federation/build-profile/{department_id}")
async def build_department_profile(
    department_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Build/refresh federation profile for a specific department."""
    if current_user.role not in ("company_admin", "dept_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(Department).where(Department.id == department_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    profile = federated_router.build_department_profile(
        department_id=str(dept.id),
        department_name=dept.name,
    )

    return {"status": "ok", "profile": profile.to_dict()}


@router.get("/federation/profiles")
async def get_federation_profiles(
    current_user: User = Depends(get_current_user),
):
    """Get all department federation profiles."""
    profiles = federated_router.get_all_profiles()
    return {
        "profiles": profiles,
        "total_departments": len(profiles),
        "federated_ready": sum(1 for p in profiles if p.get("centroid") is not None),
    }


@router.get("/federation/status")
async def get_federation_status(
    current_user: User = Depends(get_current_user),
):
    """Get current federation system status."""
    profiles = federated_router.get_all_profiles()
    ready_count = sum(1 for p in profiles if p.get("centroid") is not None)
    total_docs = sum(p.get("document_count", 0) for p in profiles)
    total_chunks = sum(p.get("chunk_count", 0) for p in profiles)

    return {
        "is_active": ready_count >= 2,  # Need at least 2 departments for federation
        "total_departments": len(profiles),
        "federated_departments": ready_count,
        "total_documents": total_docs,
        "total_chunks": total_chunks,
        "similarity_threshold": federated_router.SIMILARITY_THRESHOLD,
        "max_departments_per_query": federated_router.MAX_DEPARTMENTS,
    }
