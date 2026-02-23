import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# --- Auth Schemas ---

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    department_code: str


class GoogleAuthRequest(BaseModel):
    credential: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    role: str
    department_id: uuid.UUID
    department_name: Optional[str] = None
    is_active: bool
    plan: str = "free"
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Department Schemas ---

class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    code: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Document Schemas ---

class DocumentUploadMeta(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None  # comma-separated


class DocumentResponse(BaseModel):
    id: uuid.UUID
    department_id: uuid.UUID
    uploaded_by: uuid.UUID
    filename: str
    original_name: str
    file_type: str
    file_size: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []
    status: str
    chunk_count: int
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None


# --- Conversation Schemas ---

class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    department_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ConversationRenameRequest(BaseModel):
    title: str


# --- Chat Schemas ---

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[uuid.UUID] = None
    department_id: uuid.UUID
    federated: bool = False


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    sources: list[dict] = []
    confidence: Optional[float] = None
    feedback: Optional[str] = None
    feedback_details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackRequest(BaseModel):
    feedback: str  # "up" or "down"
    details: Optional[str] = None


# --- Admin Schemas ---

class DashboardResponse(BaseModel):
    queries_today: int
    total_documents: int
    active_users: int
    satisfaction_pct: float
    recent_activity: list[dict]


class InviteUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str  # employee, dept_admin
    department_id: uuid.UUID


class InviteUserResponse(BaseModel):
    user: UserResponse
    temp_password: str


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AnalyticsResponse(BaseModel):
    query_volume: list[dict]
    top_queries: list[dict]
    satisfaction: dict
    avg_response_time: float
    documents_by_status: dict
    active_users_trend: list[dict]
