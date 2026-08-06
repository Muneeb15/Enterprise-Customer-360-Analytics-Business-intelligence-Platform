from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.data_source import DataSource, DataSourceSummary
from backend.services import data_source_service

router = APIRouter(tags=["data-sources"])


@router.get("/data-sources", response_model=list[DataSource])
async def list_sources(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[DataSource]:
    return await data_source_service.list_sources(db, org_id=current_user.org_id)


@router.get("/data-sources/summary", response_model=DataSourceSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> DataSourceSummary:
    return await data_source_service.get_summary(db, org_id=current_user.org_id)
