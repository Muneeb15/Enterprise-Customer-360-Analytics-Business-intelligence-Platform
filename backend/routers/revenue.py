from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.revenue import RevenuePoint, CategoryRevenue, HeatmapRow
from backend.services import revenue_service
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import REVENUE_SERIES, CATEGORY_REVENUE, SEASONAL_HEATMAP

router = APIRouter(tags=["revenue"])


@router.get("/revenue-series", response_model=list[RevenuePoint])
async def get_revenue_series(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[RevenuePoint]:
    return await with_seed_fallback(
        lambda: revenue_service.get_revenue_series(db, org_id=current_user.org_id),
        REVENUE_SERIES,
    )


@router.get("/category-revenue", response_model=list[CategoryRevenue])
async def get_category_revenue(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[CategoryRevenue]:
    return await with_seed_fallback(
        lambda: revenue_service.get_category_revenue(db, org_id=current_user.org_id),
        CATEGORY_REVENUE,
    )


@router.get("/seasonal-heatmap", response_model=list[HeatmapRow])
async def get_seasonal_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[HeatmapRow]:
    return await with_seed_fallback(
        lambda: revenue_service.get_seasonal_heatmap(db, org_id=current_user.org_id),
        SEASONAL_HEATMAP,
    )
