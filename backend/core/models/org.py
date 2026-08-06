from __future__ import annotations
import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class Org(Base):
    __tablename__ = "orgs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_color: Mapped[str] = mapped_column(String(50), default="oklch(0.6 0.11 189)")

    team_members: Mapped[list["TeamMember"]] = relationship(back_populates="org")  # noqa: F821
