from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.marketing import Campaign, FunnelStage
from backend.services import marketing_service
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import CAMPAIGNS as SEED_CAMPAIGNS, FUNNEL as SEED_FUNNEL

router = APIRouter(tags=["marketing"])


@router.get("/campaigns", response_model=list[Campaign])
async def list_campaigns(
    channel: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Campaign]:
    seed = [c for c in SEED_CAMPAIGNS if not channel or channel == "All" or c.channel == channel]
    return await with_seed_fallback(
        lambda: marketing_service.get_campaigns(db, org_id=current_user.org_id, channel=channel),
        seed,
    )


@router.get("/funnel", response_model=list[FunnelStage])
async def get_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[FunnelStage]:
    # No empty_check — a real org with zero activity should see 0s, not fake seed data
    return await with_seed_fallback(
        lambda: marketing_service.get_funnel(db, org_id=current_user.org_id),
        SEED_FUNNEL,
    )
