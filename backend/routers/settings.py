from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, get_current_user, CurrentUser
from backend.schemas.settings import TeamMember
from backend.services import settings_service
from backend.utils.fallback import with_seed_fallback
from backend.data.seed import TEAM_MEMBERS as SEED_TEAM_MEMBERS

router = APIRouter(tags=["settings"])


@router.get("/team-members", response_model=list[TeamMember])
async def list_team_members(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[TeamMember]:
    return await with_seed_fallback(
        lambda: settings_service.get_team_members(db, org_id=current_user.org_id),
        SEED_TEAM_MEMBERS,
    )
