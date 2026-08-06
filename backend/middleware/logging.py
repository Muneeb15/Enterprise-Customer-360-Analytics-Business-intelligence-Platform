"""
Request/response logging middleware.
Logs method, path, status code, and duration for every request.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("nexus.http")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        # Skip logging for health checks to reduce noise
        if request.url.path not in ("/health", "/"):
            logger.info(
                "%s %s → %d (%.1fms)",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )

        # Add timing header so the frontend can see server latency
        response.headers["X-Response-Time"] = f"{duration_ms:.1f}ms"
        return response
