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

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Plan limits
    FREE_QUERIES_PER_DAY: int = 5
    FREE_MAX_DOCUMENTS: int = 3
    PRO_QUERIES_PER_DAY: int = 1000
    PRO_MAX_DOCUMENTS: int = 50

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env.local"),
        "extra": "ignore",
    }


settings = Settings()
