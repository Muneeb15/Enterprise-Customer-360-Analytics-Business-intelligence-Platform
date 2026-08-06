from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(String(100), nullable=False)
    spend: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    roas: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cac: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    events: Mapped[list["CampaignEvent"]] = relationship(back_populates="campaign")


class CampaignEvent(Base):
    """Funnel events — one row per visitor/signup/activation/conversion."""
    __tablename__ = "campaign_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("campaigns.id"), nullable=False)
    customer_id: Mapped[str | None] = mapped_column(String, ForeignKey("customers.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campaign: Mapped["Campaign"] = relationship(back_populates="events")
