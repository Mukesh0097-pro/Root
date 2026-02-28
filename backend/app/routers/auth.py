from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..config import settings
from ..models.db import User, Department
from ..models.schemas import (
    LoginRequest, RegisterRequest, RefreshRequest, GoogleAuthRequest,
    LoginResponse, TokenResponse, UserResponse, DepartmentResponse,
)
from ..auth.jwt import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_token,
)
from ..auth.dependencies import get_current_user
from ..services.audit import log_action

router = APIRouter()


@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Find department by code
    dept_result = await db.execute(select(Department).where(Department.code == req.department_code))
    department = dept_result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=400, detail="Invalid department code")

    # First user in the system becomes company_admin
    user_count = await db.execute(select(User))
    all_users = user_count.scalars().all()
    role = "company_admin" if len(all_users) == 0 else "employee"

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=role,
        department_id=department.id,
        last_login=datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(str(user.id), str(user.department_id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    await log_action(db, user.id, user.department_id, "register", "user", str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            department_id=user.department_id,
            department_name=department.name,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
    )


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    user.last_login = datetime.utcnow()
    await db.commit()

    # Get department name
    dept_result = await db.execute(select(Department).where(Department.id == user.department_id))
    department = dept_result.scalar_one_or_none()

    access_token = create_access_token(str(user.id), str(user.department_id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    await log_action(db, user.id, user.department_id, "login", "user", str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            department_id=user.department_id,
            department_name=department.name if department else None,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
    )


@router.post("/google", response_model=LoginResponse)
async def google_auth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate or register a user via Google ID token."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google Sign-In is not configured on this server. Please set GOOGLE_CLIENT_ID in the backend .env.local file.",
        )

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Google auth library not installed. Run: pip install google-auth",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_email = idinfo.get("email")
    if not google_email or not idinfo.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google email not verified")

    first_name = idinfo.get("given_name", "")
    last_name = idinfo.get("family_name", "")

    result = await db.execute(select(User).where(User.email == google_email))
    user = result.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")
        user.last_login = datetime.utcnow()
        await db.commit()
    else:
        # Auto-register: assign to the first available department
        dept_result = await db.execute(
            select(Department).order_by(Department.name).limit(1)
        )
        department = dept_result.scalar_one_or_none()
        if not department:
            raise HTTPException(
                status_code=500,
                detail="No departments configured. Contact your administrator.",
            )

        user_count_result = await db.execute(select(User))
        all_users = user_count_result.scalars().all()
        role = "company_admin" if len(all_users) == 0 else "employee"

        user = User(
            email=google_email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            first_name=first_name or google_email.split("@")[0],
            last_name=last_name or "",
            role=role,
            department_id=department.id,
            last_login=datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        await log_action(db, user.id, user.department_id, "register_google", "user", str(user.id))

    # Get department name for response
    dept_result = await db.execute(select(Department).where(Department.id == user.department_id))
    department = dept_result.scalar_one_or_none()

    access_token = create_access_token(str(user.id), str(user.department_id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    await log_action(db, user.id, user.department_id, "login_google", "user", str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            department_id=user.department_id,
            department_name=department.name if department else None,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    access_token = create_access_token(str(user.id), str(user.department_id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dept_result = await db.execute(select(Department).where(Department.id == current_user.department_id))
    department = dept_result.scalar_one_or_none()

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        department_id=current_user.department_id,
        department_name=department.name if department else None,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
    )


@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Department).order_by(Department.name))
        departments = result.scalars().all()
        return [DepartmentResponse.model_validate(d) for d in departments]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
