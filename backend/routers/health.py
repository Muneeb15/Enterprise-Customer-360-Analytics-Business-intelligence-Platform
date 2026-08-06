from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"status": "ok", "docs": "/docs", "api": "/api", "health": "/health"}
