"""
Declarative base for all SQLAlchemy ORM models.
Import Base in every models/*.py file.

For Alembic autogenerate, import this module in alembic/env.py
AFTER all model modules have been imported.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
