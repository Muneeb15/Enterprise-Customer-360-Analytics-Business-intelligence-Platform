from __future__ import annotations
import uuid
from sqlalchemy import String, Integer, Float, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class RevenueSnapshot(Base):
    """Pre-aggregated monthly revenue per org — refreshed nightly."""
    __tablename__ = "revenue_snapshots"
    __table_args__ = (
        UniqueConstraint("org_id", "period", "category", "region", name="uq_snapshot_org_period_cat_reg"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False)
    month_label: Mapped[str] = mapped_column(String(3), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gross_revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    prior_revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bookings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expansion_mrr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    share: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class SeasonalHeatmap(Base):
    """Weekly × monthly revenue intensity per org."""
    __tablename__ = "seasonal_heatmap"
    __table_args__ = (
        UniqueConstraint("org_id", "week", "month", name="uq_heatmap_org_week_month"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    week: Mapped[str] = mapped_column(String(3), nullable=False)
    month: Mapped[str] = mapped_column(String(3), nullable=False)
    intensity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class CustomerRFM(Base):
    """Per-customer RFM scores."""
    __tablename__ = "customer_rfm"

    customer_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("customers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    recency_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    frequency_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    monetary_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    segment: Mapped[str] = mapped_column(String(100), nullable=False, default="New / Onboarding")
    recency_label: Mapped[str] = mapped_column(String(50), nullable=False, default="")

    customer: Mapped["Customer"] = relationship(
        back_populates="rfm",
        foreign_keys=[customer_id],
    )  # noqa: F821
