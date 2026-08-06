from __future__ import annotations
import uuid
import enum
from datetime import date
from sqlalchemy import String, Integer, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class TransactionCategory(str, enum.Enum):
    billing = "Billing"
    support = "Support"
    contract = "Contract"
    product = "Product"
    expansion = "Expansion"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String, ForeignKey("products.id"), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    category: Mapped[TransactionCategory] = mapped_column(SAEnum(TransactionCategory), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    occurred_at: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    customer: Mapped["Customer"] = relationship(back_populates="transactions")  # noqa: F821
    product: Mapped["Product | None"] = relationship(back_populates="transactions")  # noqa: F821
