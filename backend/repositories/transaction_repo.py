from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.transaction import Transaction


async def get_by_customer(db: AsyncSession, customer_id: str) -> list[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.customer_id == customer_id)
        .order_by(Transaction.occurred_at.desc())
    )
    return list(result.scalars().all())
