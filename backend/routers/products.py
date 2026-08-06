from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.product import Product, CategoryBreakdown, ProductPerformanceSummary
from backend.services import product_service

router = APIRouter(tags=["products"])


@router.get("/products", response_model=list[Product])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Product]:
    return await product_service.list_products(db, org_id=current_user.org_id)


@router.get("/products/categories", response_model=list[CategoryBreakdown])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[CategoryBreakdown]:
    return await product_service.get_category_breakdown(db, org_id=current_user.org_id)


@router.get("/products/summary", response_model=ProductPerformanceSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> ProductPerformanceSummary:
    return await product_service.get_summary(db, org_id=current_user.org_id)
