from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.kpi import Kpi
from backend.services import kpi_service
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import KPIS as SEED_KPIS

router = APIRouter(tags=["kpis"])


@router.get("/kpis", response_model=list[Kpi])
async def list_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Kpi]:
    # No empty_check — a real org with $0 revenue should see $0, not fake seed data
    return await with_seed_fallback(
        lambda: kpi_service.get_kpis(db, org_id=current_user.org_id),
        SEED_KPIS,
    )
