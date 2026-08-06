from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.campaign import Campaign, CampaignEvent


async def get_all(db: AsyncSession, org_id: str, channel: str | None = None) -> list[Campaign]:
    q = select(Campaign).where(Campaign.org_id == org_id)
    if channel and channel != "All":
        q = q.where(Campaign.channel == channel)
    result = await db.execute(q.order_by(Campaign.revenue.desc()))
    return list(result.scalars().all())


async def get_funnel_counts(db: AsyncSession, org_id: str) -> list[dict]:
    stage_order = ["visitor", "signup", "activated", "paying", "retained"]
    stage_labels = {
        "visitor": "Visitors",
        "signup": "Signups",
        "activated": "Activated",
        "paying": "Paying",
        "retained": "Retained (90d)",
    }
    q = (
        select(CampaignEvent.event_type, func.count(CampaignEvent.id).label("total"))
        .where(CampaignEvent.org_id == org_id)
        .group_by(CampaignEvent.event_type)
    )
    rows = {r.event_type: r.total for r in (await db.execute(q)).all()}
    return [
        {"stage": stage_labels[s], "value": rows.get(s, 0)}
        for s in stage_order
    ]
