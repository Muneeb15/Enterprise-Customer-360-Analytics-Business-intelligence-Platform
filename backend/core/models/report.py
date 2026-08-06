from __future__ import annotations
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class ReportType(str, enum.Enum):
    executive = "Executive"
    retention = "Retention"
    segmentation = "Segmentation"
    regional = "Regional"
    marketing = "Marketing"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    size: Mapped[str] = mapped_column(String(20), nullable=False, default="0 MB")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    jobs: Mapped[list["Job"]] = relationship(back_populates="report")  # noqa: F821
