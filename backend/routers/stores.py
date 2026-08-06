from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.store import Store, BranchPerformanceSummary
from backend.services import store_service

router = APIRouter(tags=["stores"])


@router.get("/stores", response_model=list[Store])
async def list_stores(
    country: str | None = Query(default=None),
    region: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Store]:
    return await store_service.list_stores(db, org_id=current_user.org_id, country=country, region=region)


@router.get("/stores/summary", response_model=BranchPerformanceSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> BranchPerformanceSummary:
    return await store_service.get_summary(db, org_id=current_user.org_id)
