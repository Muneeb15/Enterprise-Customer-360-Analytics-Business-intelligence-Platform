from __future__ import annotations
import uuid
import enum
from sqlalchemy import String, Integer, Float, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base import Base


class ProductCategory(str, enum.Enum):
    platform = "Platform"
    services = "Services"
    addons = "Add-ons"
    enterprise_support = "Enterprise Support"
    training = "Training"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    category: Mapped[ProductCategory] = mapped_column(SAEnum(ProductCategory), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    units_sold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    revenue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    growth_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    return_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Active")

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="product")  # noqa: F821
