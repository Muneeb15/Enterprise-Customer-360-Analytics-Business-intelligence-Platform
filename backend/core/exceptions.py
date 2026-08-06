from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, resource: str, id: str) -> None:
        self.resource = resource
        self.id = id
        super().__init__(f"{resource} '{id}' not found")


class ConflictError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(
            status_code=409,
            content={"detail": str(exc)},
        )

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content={"detail": str(exc)},
        )
