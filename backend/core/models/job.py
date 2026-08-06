from __future__ import annotations
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    ready = "ready"
    error = "error"


class Job(Base):
    """
    Persisted PDF generation job.
    Replaces the in-process JOBS dict — survives restarts and scales across workers.
    """
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(String, ForeignKey("reports.id"), nullable=False)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), nullable=False, default=JobStatus.queued)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    report: Mapped["Report"] = relationship(back_populates="jobs")  # noqa: F821
