"""
Storage service abstraction layer.

Supports multiple backends:
  - local: Local filesystem storage (default)
  - s3: Amazon S3 or S3-compatible storage (MinIO, DigitalOcean Spaces, etc.)

Configure via environment variables:
  STORAGE_BACKEND=local|s3
  UPLOAD_DIR (for local)
  S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT_URL (for s3)
"""

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, filename: str, data: bytes) -> str:
        """Save file data. Returns the storage key/path."""
        ...

    @abstractmethod
    async def read(self, filename: str) -> bytes:
        """Read file data by filename."""
        ...

    @abstractmethod
    async def delete(self, filename: str) -> bool:
        """Delete a file. Returns True on success."""
        ...

    @abstractmethod
    async def exists(self, filename: str) -> bool:
        """Check if a file exists."""
        ...

    @abstractmethod
    def get_path(self, filename: str) -> str:
        """Get the full path/URL for a file."""
        ...


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage."""

    def __init__(self):
        self._dir = Path(settings.UPLOAD_DIR)
        self._dir.mkdir(parents=True, exist_ok=True)

    async def save(self, filename: str, data: bytes) -> str:
        path = self._dir / filename
        path.write_bytes(data)
        return str(path)

    async def read(self, filename: str) -> bytes:
        path = self._dir / filename
        if not path.exists():
            raise FileNotFoundError(f"File not found: {filename}")
        return path.read_bytes()

    async def delete(self, filename: str) -> bool:
        path = self._dir / filename
        if path.exists():
            path.unlink()
            return True
        return False

    async def exists(self, filename: str) -> bool:
        return (self._dir / filename).exists()

    def get_path(self, filename: str) -> str:
        return str(self._dir / filename)


class S3StorageBackend(StorageBackend):
    """Amazon S3 or S3-compatible storage."""

    def __init__(self):
        self._bucket = settings.S3_BUCKET
        self._region = settings.S3_REGION
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import boto3
                kwargs = {
                    "aws_access_key_id": settings.S3_ACCESS_KEY,
                    "aws_secret_access_key": settings.S3_SECRET_KEY,
                    "region_name": self._region,
                }
                if settings.S3_ENDPOINT_URL:
                    kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
                self._client = boto3.client("s3", **kwargs)
            except ImportError:
                raise RuntimeError("boto3 not installed. Run: pip install boto3")
        return self._client

    async def save(self, filename: str, data: bytes) -> str:
        import io
        client = self._get_client()
        client.upload_fileobj(
            io.BytesIO(data),
            self._bucket,
            filename,
        )
        return f"s3://{self._bucket}/{filename}"

    async def read(self, filename: str) -> bytes:
        import io
        client = self._get_client()
        buf = io.BytesIO()
        client.download_fileobj(self._bucket, filename, buf)
        buf.seek(0)
        return buf.read()

    async def delete(self, filename: str) -> bool:
        try:
            client = self._get_client()
            client.delete_object(Bucket=self._bucket, Key=filename)
            return True
        except Exception as e:
            logger.error(f"S3 delete failed: {e}")
            return False

    async def exists(self, filename: str) -> bool:
        try:
            client = self._get_client()
            client.head_object(Bucket=self._bucket, Key=filename)
            return True
        except Exception:
            return False

    def get_path(self, filename: str) -> str:
        if settings.S3_ENDPOINT_URL:
            return f"{settings.S3_ENDPOINT_URL}/{self._bucket}/{filename}"
        return f"https://{self._bucket}.s3.{self._region}.amazonaws.com/{filename}"


def _get_backend() -> StorageBackend:
    backend = settings.STORAGE_BACKEND.lower()
    if backend == "s3":
        return S3StorageBackend()
    return LocalStorageBackend()


class StorageService:
    """High-level storage service."""

    def __init__(self):
        self._backend = _get_backend()

    async def save_file(self, filename: str, data: bytes) -> str:
        return await self._backend.save(filename, data)

    async def read_file(self, filename: str) -> bytes:
        return await self._backend.read(filename)

    async def delete_file(self, filename: str) -> bool:
        return await self._backend.delete(filename)

    async def file_exists(self, filename: str) -> bool:
        return await self._backend.exists(filename)

    def get_file_path(self, filename: str) -> str:
        return self._backend.get_path(filename)

    @property
    def is_local(self) -> bool:
        return isinstance(self._backend, LocalStorageBackend)


# Singleton instance
storage_service = StorageService()
