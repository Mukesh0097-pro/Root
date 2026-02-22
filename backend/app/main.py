from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine
from .models.db import Base
from .routers import auth as auth_router
from .routers import chat as chat_router
from .routers import documents as documents_router
from .routers import admin as admin_router
from .routers import federation as federation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure upload and FAISS directories exist
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.FAISS_DIR).mkdir(parents=True, exist_ok=True)

    yield


app = FastAPI(title="FedKnowledge API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat_router.router, prefix="/api", tags=["chat"])
app.include_router(documents_router.router, prefix="/api", tags=["documents"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])
app.include_router(federation_router.router, prefix="/api", tags=["federation"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
