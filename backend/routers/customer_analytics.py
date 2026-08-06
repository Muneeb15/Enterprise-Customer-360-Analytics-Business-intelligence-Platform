from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.services.customer_analytics_service import get_customer_analytics

router = APIRouter(tags=["customer-analytics"])


@router.get("/customer-analytics")
async def customer_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    return await get_customer_analytics(db, current_user.org_id)
