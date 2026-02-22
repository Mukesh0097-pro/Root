from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fedknowledge"
    GEMINI_API_KEY: str = ""
    JWT_SECRET: str = "change-me-in-production-use-a-real-secret"
    JWT_ACCESS_EXPIRE_MINUTES: int = 480  # 8 hours
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    UPLOAD_DIR: str = str(Path(__file__).resolve().parent.parent / "uploads")
    FAISS_DIR: str = str(Path(__file__).resolve().parent.parent / "faiss_indexes")
    GOOGLE_CLIENT_ID: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:3000"  # comma-separated for multiple origins

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env.local"),
        "extra": "ignore",
    }


settings = Settings()
