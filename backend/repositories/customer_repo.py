from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.customer import Customer, CustomerStatus


async def get_all(
    db: AsyncSession,
    org_id: str,
    segment: str | None = None,
    status: str | None = None,
) -> list[Customer]:
    q = (
        select(Customer)
        .where(Customer.org_id == org_id)
        .options(selectinload(Customer.rfm))
    )
    if segment:
        q = q.where(Customer.segment == segment)
    if status:
        q = q.where(Customer.status == status)
    q = q.order_by(Customer.ltv.desc())
    return list((await db.execute(q)).scalars().all())


async def get_by_id(db: AsyncSession, org_id: str, customer_id: str) -> Customer | None:
    result = await db.execute(
        select(Customer)
        .where(Customer.id == customer_id, Customer.org_id == org_id)
        .options(selectinload(Customer.rfm))
    )
    return result.scalar_one_or_none()


async def count_by_segment(db: AsyncSession, org_id: str) -> list[dict]:
    q = (
        select(
            Customer.segment,
            func.count(Customer.id).label("count"),
            func.sum(Customer.ltv).label("revenue"),
        )
        .where(Customer.org_id == org_id)
        .group_by(Customer.segment)
    )
    rows = (await db.execute(q)).all()
    total_rev = sum(r.revenue or 0 for r in rows)
    return [
        {
            "name": r.segment,
            "count": r.count,
            "revenue": r.revenue or 0,
            "share": round((r.revenue or 0) / total_rev * 100) if total_rev else 0,
        }
        for r in rows
    ]


async def count_by_region(db: AsyncSession, org_id: str) -> list[dict]:
    q = (
        select(
            Customer.region,
            func.sum(Customer.ltv).label("revenue"),
        )
        .where(Customer.org_id == org_id)
        .group_by(Customer.region)
    )
    rows = (await db.execute(q)).all()
    total = sum(r.revenue or 0 for r in rows)
    return [
        {
            "name": r.region,
            "revenue": r.revenue or 0,
            "share": round((r.revenue or 0) / total * 100) if total else 0,
        }
        for r in sorted(rows, key=lambda r: r.revenue or 0, reverse=True)
    ]
