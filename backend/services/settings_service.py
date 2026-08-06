from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.team_member import TeamMember as TeamMemberModel
from backend.schemas.settings import TeamMember
from backend.utils.logging import get_logger

logger = get_logger("settings_service")


async def get_team_members(db: AsyncSession, org_id: str) -> list[TeamMember]:
    """Return all team members for the given org, ordered by role then name."""
    result = await db.execute(
        select(TeamMemberModel)
        .where(TeamMemberModel.org_id == org_id)
        .order_by(TeamMemberModel.role, TeamMemberModel.name)
    )
    members = result.scalars().all()
    return [
        TeamMember(
            id=m.id,
            name=m.name,
            email=m.email,
            role=m.role,
            lastActive=m.last_active,
        )
        for m in members
    ]
