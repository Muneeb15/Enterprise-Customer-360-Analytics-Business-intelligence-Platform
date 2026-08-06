from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.db.base import Base


class DataSource(Base):
    """
    Registered external data source (CRM, ERP, POS, etc.).
    Tracks connection status and last sync time.
    """
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)   # crm|erp|pos|web|mobile|support|email|payment|social
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="disconnected")  # connected|disconnected|error|syncing
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    records_synced: Mapped[int] = mapped_column(String(20), nullable=False, default="0")
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)   # encrypted config (keys, endpoints)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
