from __future__ import annotations
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("orgs.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="Viewer")
    last_active: Mapped[str] = mapped_column(String(50), default="Never")
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    clerk_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)

    org: Mapped["Org"] = relationship(back_populates="team_members")  # noqa: F821
