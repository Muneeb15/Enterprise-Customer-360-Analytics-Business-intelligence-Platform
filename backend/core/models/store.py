from __future__ import annotations
import uuid
from sqlalchemy import String, Integer, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class Store(Base):
    """Retail store / branch — linked to org and transactions."""
    __tablename__ = "stores"
    __table_args__ = (
        Index("ix_stores_org_id", "org_id"),
        Index("ix_stores_country", "country"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)   # e.g. "NYC-001"
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    manager: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    staff_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    annual_target: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    annual_revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    customer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nps_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Active")
