from __future__ import annotations
import uuid
from datetime import date
from sqlalchemy import String, Integer, Date, Enum as SAEnum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base
import enum


class CustomerStatus(str, enum.Enum):
    active = "Active"
    at_risk = "At Risk"
    churned = "Churned"


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_org_segment", "org_id", "segment"),
        Index("ix_customers_org_status", "org_id", "status"),
        Index("ix_customers_org_region", "org_id", "region"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[CustomerStatus] = mapped_column(SAEnum(CustomerStatus), nullable=False, default=CustomerStatus.active)
    segment: Mapped[str] = mapped_column(String(100), nullable=False, default="New / Onboarding")
    region: Mapped[str] = mapped_column(String(100), nullable=False, default="North America")
    mrr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ltv: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    monetary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_activity: Mapped[date | None] = mapped_column(Date, nullable=True)
    joined: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    org: Mapped["Org"] = relationship()  # noqa: F821
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="customer", order_by="Transaction.occurred_at.desc()")  # noqa: F821
    rfm: Mapped["CustomerRFM | None"] = relationship(back_populates="customer", uselist=False)  # noqa: F821
