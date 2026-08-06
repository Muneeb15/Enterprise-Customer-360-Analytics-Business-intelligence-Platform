from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from backend.core.config import get_settings
from backend.db.base import Base

# Import all models so Alembic autogenerate sees every table
import backend.models.org            # noqa: F401
import backend.models.team_member    # noqa: F401
import backend.models.customer       # noqa: F401
import backend.models.product        # noqa: F401
import backend.models.transaction    # noqa: F401
import backend.models.campaign       # noqa: F401
import backend.models.revenue_snapshot  # noqa: F401
import backend.models.report         # noqa: F401
import backend.models.job            # noqa: F401
import backend.models.import_log     # noqa: F401

config = context.config
settings = get_settings()

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.connect() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
