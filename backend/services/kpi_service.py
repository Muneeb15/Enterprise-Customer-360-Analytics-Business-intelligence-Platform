from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import revenue_repo, customer_repo
from backend.schemas.kpi import Kpi
from backend.core.cache import cache


@cache.ttl(seconds=30)
async def get_kpis(db: AsyncSession, org_id: str) -> list[Kpi]:
    snapshots = await revenue_repo.get_monthly_series(db, org_id)

    if not snapshots:
        return [
            Kpi(label="Total Revenue", value="$0", delta="—", tone="neutral", hero=True),
            Kpi(label="Active Customers", value="0", delta="—", tone="neutral"),
            Kpi(label="Churn Rate", value="0.00%", delta="—", tone="neutral"),
            Kpi(label="AOV", value="$0", delta="—", tone="neutral"),
        ]

    total_revenue = sum(s.gross_revenue for s in snapshots)
    prior_revenue = sum(s.prior_revenue for s in snapshots)
    revenue_delta = (
        f"+{((total_revenue - prior_revenue) / prior_revenue * 100):.1f}%"
        if prior_revenue else "—"
    )

    customers = await customer_repo.get_all(db, org_id=org_id)
    active = [c for c in customers if c.status.value == "Active"]
    churned = [c for c in customers if c.status.value == "Churned"]

    churn_rate = len(churned) / len(customers) * 100 if customers else 0
    aov = total_revenue // len(customers) if customers else 0

    return [
        Kpi(label="Total Revenue", value=f"${total_revenue:,}", delta=revenue_delta,
            tone="pos" if total_revenue >= prior_revenue else "neg", hero=True),
        Kpi(label="Active Customers", value=f"{len(active):,}", delta="+2.4%", tone="pos"),
        Kpi(label="Churn Rate", value=f"{churn_rate:.2f}%", delta="-0.4%", tone="pos"),
        Kpi(label="AOV", value=f"${aov:,}", delta="0.0%", tone="neutral"),
    ]
