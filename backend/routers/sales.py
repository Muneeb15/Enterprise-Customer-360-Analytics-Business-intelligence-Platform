from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.revenue import Region
from backend.services import revenue_service
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import REGIONS as SEED_REGIONS

router = APIRouter(tags=["sales"])


@router.get("/regions", response_model=list[Region])
async def list_regions(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Region]:
    return await with_seed_fallback(
        lambda: revenue_service.get_regions(db, org_id=current_user.org_id),
        SEED_REGIONS,
    )
