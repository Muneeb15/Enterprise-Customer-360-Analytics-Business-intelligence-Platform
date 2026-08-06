from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.revenue_snapshot import RevenueSnapshot, SeasonalHeatmap


async def get_monthly_series(db: AsyncSession, org_id: str) -> list[RevenueSnapshot]:
    result = await db.execute(
        select(RevenueSnapshot)
        .where(
            RevenueSnapshot.org_id == org_id,
            RevenueSnapshot.category.is_(None),
            RevenueSnapshot.region.is_(None),
        )
        .order_by(RevenueSnapshot.period)
    )
    return list(result.scalars().all())


async def get_by_category(db: AsyncSession, org_id: str) -> list[RevenueSnapshot]:
    result = await db.execute(
        select(RevenueSnapshot)
        .where(
            RevenueSnapshot.org_id == org_id,
            RevenueSnapshot.category.isnot(None),
            RevenueSnapshot.region.is_(None),
        )
        .order_by(RevenueSnapshot.gross_revenue.desc())
    )
    return list(result.scalars().all())


async def get_heatmap(db: AsyncSession, org_id: str) -> list[SeasonalHeatmap]:
    result = await db.execute(
        select(SeasonalHeatmap)
        .where(SeasonalHeatmap.org_id == org_id)
        .order_by(SeasonalHeatmap.week, SeasonalHeatmap.month)
    )
    return list(result.scalars().all())


async def get_total_revenue(db: AsyncSession, org_id: str) -> int:
    rows = await get_monthly_series(db, org_id)
    return sum(r.gross_revenue for r in rows)
