"""
In-memory sliding-window rate limiter middleware.

Provides per-user (JWT) and per-IP rate limiting with configurable
limits for different endpoint groups (auth, chat/query, general API).
"""

import time
import asyncio
from collections import defaultdict
from typing import Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ..config import settings


class _SlidingWindow:
    """Thread-safe sliding window counter."""

    __slots__ = ("_entries", "_window_seconds")

    def __init__(self, window_seconds: int):
        self._entries: list[float] = []
        self._window_seconds = window_seconds

    def hit(self) -> int:
        """Record a hit and return the current count within the window."""
        now = time.monotonic()
        cutoff = now - self._window_seconds
        self._entries = [t for t in self._entries if t > cutoff]
        self._entries.append(now)
        return len(self._entries)

    def count(self) -> int:
        now = time.monotonic()
        cutoff = now - self._window_seconds
        self._entries = [t for t in self._entries if t > cutoff]
        return len(self._entries)

    @property
    def oldest(self) -> Optional[float]:
        return self._entries[0] if self._entries else None


# Route group definitions
_AUTH_PREFIXES = ("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password")
_QUERY_PREFIXES = ("/api/query", "/api/chat")


def _route_group(path: str) -> str:
    """Classify a request path into a rate-limit group."""
    for prefix in _AUTH_PREFIXES:
        if path.startswith(prefix):
            return "auth"
    for prefix in _QUERY_PREFIXES:
        if path.startswith(prefix):
            return "query"
    return "general"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter.

    Limits (requests / window):
      - auth:    20 / 60s per IP
      - query:   60 / 60s per user (or IP if unauthenticated)
      - general: 120 / 60s per user (or IP if unauthenticated)
    """

    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        # key -> SlidingWindow
        self._windows: dict[str, _SlidingWindow] = defaultdict(lambda: _SlidingWindow(60))
        # Limits per group
        self._limits = {
            "auth": settings.RATE_LIMIT_AUTH,
            "query": settings.RATE_LIMIT_QUERY,
            "general": settings.RATE_LIMIT_GENERAL,
        }
        # Periodic cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ("/api/health", "/api/health/db"):
            return await call_next(request)

        # Skip non-API routes
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        group = _route_group(request.url.path)
        limit = self._limits[group]

        # Identify caller
        identity = self._get_identity(request, group)
        key = f"{group}:{identity}"

        window = self._windows[key]
        current = window.hit()

        if current > limit:
            retry_after = 60  # window size
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current))

        # Start cleanup if not running
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

        return response

    def _get_identity(self, request: Request, group: str) -> str:
        """Extract identity for rate limiting: user ID from JWT or client IP."""
        if group == "auth":
            # Auth endpoints are always keyed by IP
            return self._get_client_ip(request)

        # Try to extract user ID from Authorization header
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                from ..auth.jwt import verify_token
                token = auth_header[7:]
                payload = verify_token(token)
                if payload and payload.get("sub"):
                    return f"user:{payload['sub']}"
            except Exception:
                pass

        return self._get_client_ip(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def _cleanup_loop(self):
        """Periodically clean up expired windows to prevent memory leaks."""
        while True:
            await asyncio.sleep(300)  # every 5 minutes
            now = time.monotonic()
            expired_keys = []
            for key, window in self._windows.items():
                if window.count() == 0:
                    expired_keys.append(key)
            for key in expired_keys:
                del self._windows[key]
