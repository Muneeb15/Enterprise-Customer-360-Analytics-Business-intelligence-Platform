"""
Slow request timing middleware.
Adds X-Response-Time header and warns on requests > 2s.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("nexus.timing")

SLOW_THRESHOLD_MS = 2000


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000

        if ms > SLOW_THRESHOLD_MS:
            logger.warning(
                "Slow request: %s %s took %.0fms",
                request.method,
                request.url.path,
                ms,
            )

        response.headers["X-Response-Time"] = f"{ms:.1f}ms"
        return response
