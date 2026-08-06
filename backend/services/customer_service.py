from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from backend.repositories import customer_repo, transaction_repo
from backend.analytics.rfm import compute_rfm
from backend.schemas.customer import Customer, CustomerTransaction, Segment
from backend.core.cache import cache


@cache.ttl(seconds=30)
async def get_customers(
    db: AsyncSession,
    org_id: str,
    segment: str | None = None,
    status: str | None = None,
) -> list[Customer]:
    rows = await customer_repo.get_all(db, org_id=org_id, segment=segment, status=status)
    return [_to_customer_schema(c) for c in rows]


async def get_customer(db: AsyncSession, org_id: str, customer_id: str) -> Customer | None:
    row = await customer_repo.get_by_id(db, org_id=org_id, customer_id=customer_id)
    return _to_customer_schema(row) if row else None


async def get_transactions(
    db: AsyncSession, customer_id: str
) -> list[CustomerTransaction]:
    rows = await transaction_repo.get_by_customer(db, customer_id)
    return [
        CustomerTransaction(
            id=t.id,
            date=t.occurred_at.isoformat(),
            description=t.description,
            category=t.category.value,
            amount=t.amount,
        )
        for t in rows
    ]


@cache.ttl(seconds=60)
async def get_segments(db: AsyncSession, org_id: str) -> list[Segment]:
    rows = await customer_repo.count_by_segment(db, org_id=org_id)
    return [
        Segment(name=r["name"], share=r["share"], revenue=r["revenue"], count=r["count"])
        for r in rows
    ]


def filter_seed(customers, *, segment: str | None, status: str | None):
    """Filter the in-memory seed list — mirrors the DB query for the fallback."""
    rows = customers
    if segment:
        rows = [c for c in rows if c.segment == segment]
    if status:
        rows = [c for c in rows if c.status == status]
    return rows


def _to_customer_schema(c) -> Customer:  # noqa: ANN001
    rfm = c.rfm
    if rfm:
        recency = rfm.recency_label
        frequency = rfm.frequency_score
        monetary = rfm.monetary_score
    else:
        result = compute_rfm(c.last_activity, c.frequency, c.ltv)
        recency = result.recency_label
        frequency = result.frequency_score
        monetary = result.monetary_score

    return Customer(
        id=c.id,
        name=c.name,
        status=c.status.value,
        segment=c.segment,
        region=c.region,
        ltv=c.ltv,
        mrr=c.mrr,
        recency=recency,
        frequency=frequency,
        monetary=monetary,
        joined=c.joined.isoformat() if isinstance(c.joined, date) else str(c.joined),
    )
