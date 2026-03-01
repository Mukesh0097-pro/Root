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
    FRONTEND_URL: str = ""  # Explicit frontend URL for Stripe redirects (overrides ALLOWED_ORIGINS)

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    # Optional: set these directly from Stripe Dashboard to avoid dynamic price lookup
    STRIPE_PRICE_PRO_MONTHLY: str = ""
    STRIPE_PRICE_PRO_YEARLY: str = ""
    STRIPE_PRICE_BUSINESS_MONTHLY: str = ""
    STRIPE_PRICE_BUSINESS_YEARLY: str = ""

    @property
    def stripe_frontend_url(self) -> str:
        """Returns the frontend URL to use in Stripe success/cancel redirects."""
        if self.FRONTEND_URL:
            return self.FRONTEND_URL.rstrip("/")
        return self.ALLOWED_ORIGINS.split(",")[0].strip().rstrip("/")

    # Rate limiting (requests per 60-second window)
    RATE_LIMIT_AUTH: int = 20       # login/register/forgot-password
    RATE_LIMIT_QUERY: int = 60      # chat/query endpoints
    RATE_LIMIT_GENERAL: int = 120   # all other API endpoints

    # Plan limits
    FREE_QUERIES_PER_DAY: int = 5
    FREE_MAX_DOCUMENTS: int = 3
    PRO_QUERIES_PER_DAY: int = 1000
    PRO_MAX_DOCUMENTS: int = 50

    # Email
    EMAIL_BACKEND: str = "console"  # console, smtp, sendgrid
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "noreply@fedknowledge.com"
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM: str = "noreply@fedknowledge.com"

    # Storage
    STORAGE_BACKEND: str = "local"  # local, s3
    S3_BUCKET: str = ""
    S3_REGION: str = "ap-southeast-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_ENDPOINT_URL: str = ""  # for S3-compatible services (MinIO, DigitalOcean Spaces)

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env.local"),
        "extra": "ignore",
    }


settings = Settings()
