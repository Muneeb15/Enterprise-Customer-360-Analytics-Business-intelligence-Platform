from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import campaign_repo
from backend.schemas.marketing import Campaign, FunnelStage


async def get_campaigns(db: AsyncSession, org_id: str, channel: str | None = None) -> list[Campaign]:
    rows = await campaign_repo.get_all(db, org_id=org_id, channel=channel)
    return [
        Campaign(id=c.id, name=c.name, channel=c.channel,
                 spend=c.spend, revenue=c.revenue, roas=c.roas, cac=c.cac)
        for c in rows
    ]


async def get_funnel(db: AsyncSession, org_id: str) -> list[FunnelStage]:
    rows = await campaign_repo.get_funnel_counts(db, org_id=org_id)
    return [FunnelStage(stage=r["stage"], value=r["value"]) for r in rows]
