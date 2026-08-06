from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import revenue_repo, customer_repo
from backend.analytics.seasonal import compute_heatmap
from backend.schemas.revenue import RevenuePoint, CategoryRevenue, HeatmapRow, Region
from backend.core.cache import cache


@cache.ttl(seconds=60)
async def get_revenue_series(db: AsyncSession, org_id: str) -> list[RevenuePoint]:
    snapshots = await revenue_repo.get_monthly_series(db, org_id)
    return [
        RevenuePoint(month=s.month_label, revenue=s.gross_revenue, prior=s.prior_revenue)
        for s in snapshots
    ]


@cache.ttl(seconds=60)
async def get_category_revenue(db: AsyncSession, org_id: str) -> list[CategoryRevenue]:
    rows = await revenue_repo.get_by_category(db, org_id)
    totals: dict[str, int] = {}
    for r in rows:
        totals[r.category] = totals.get(r.category, 0) + r.gross_revenue
    return [
        CategoryRevenue(name=cat, value=total)
        for cat, total in sorted(totals.items(), key=lambda x: x[1], reverse=True)
    ]


@cache.ttl(seconds=3600)
async def get_seasonal_heatmap(db: AsyncSession, org_id: str) -> list[HeatmapRow]:
    rows = await revenue_repo.get_heatmap(db, org_id)
    by_week: dict[str, list] = {}
    for r in rows:
        by_week.setdefault(r.week, []).append({"month": r.month, "intensity": r.intensity})
    if by_week:
        return [HeatmapRow(week=w, values=cells) for w, cells in sorted(by_week.items())]
    raw = compute_heatmap({})
    return [HeatmapRow(**row) for row in raw]


async def get_regions(db: AsyncSession, org_id: str) -> list[Region]:
    rows = await customer_repo.count_by_region(db, org_id=org_id)
    return [Region(name=r["name"], share=r["share"], revenue=r["revenue"]) for r in rows]
