from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import get_settings
from backend.core.exceptions import register_exception_handlers
from backend.core.logging import configure_logging
from backend.middleware import LoggingMiddleware, TimingMiddleware
from backend.routers import (
    health, kpis, revenue, customers, sales, marketing,
    reports, jobs, settings, csv_import, products, stores,
    data_sources, analytics, customer_analytics,
)

_settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging(is_dev=_settings.is_dev)
    _settings.storage_dir  # ensure storage dir exists

    # Auto-seed in-memory/SQLite if DB is available and empty
    if _settings.is_dev:
        await _auto_seed_if_empty()

    yield
    from backend.db.session import engine
    await engine.dispose()


async def _auto_seed_if_empty() -> None:
    """
    In dev mode, run the seeder automatically if the customers table is empty.
    This means the full service→repository→DB stack serves real data
    instead of the raw seed constants.
    """
    try:
        from sqlalchemy import text
        from backend.db.session import AsyncSessionLocal
        from backend.db.base import Base
        from backend.db.session import engine
        import backend.models.org              # noqa: F401
        import backend.models.team_member      # noqa: F401
        import backend.models.customer         # noqa: F401
        import backend.models.product          # noqa: F401
        import backend.models.transaction      # noqa: F401
        import backend.models.campaign         # noqa: F401
        import backend.models.revenue_snapshot # noqa: F401
        import backend.models.report           # noqa: F401
        import backend.models.job              # noqa: F401
        import backend.models.store            # noqa: F401
        import backend.models.data_source      # noqa: F401

        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Check if customers table is empty
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("SELECT COUNT(*) FROM customers"))
            count = result.scalar_one()

        if count == 0:
            import logging
            log = logging.getLogger("nexus.startup")
            log.info("Database empty — running auto-seed...")
            from backend.scripts.seed import main as run_seed
            await run_seed()
            log.info("Auto-seed complete")
    except Exception as exc:
        import logging
        logging.getLogger("nexus.startup").warning(
            "Auto-seed skipped (DB not available, will use seed fallback): %s", exc
        )


app = FastAPI(
    title="Nexus Analytics API",
    version="0.2.0",
    description="Production-grade backend for the Nexus Analytics dashboard.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)
app.add_middleware(TimingMiddleware)

register_exception_handlers(app)

# Routers — same /api prefix, same paths as v0.1
app.include_router(health.router)           # /health, /
app.include_router(kpis.router,       prefix="/api")
app.include_router(revenue.router,    prefix="/api")
app.include_router(customers.router,  prefix="/api")
app.include_router(sales.router,      prefix="/api")
app.include_router(marketing.router,  prefix="/api")
app.include_router(reports.router,    prefix="/api")
app.include_router(jobs.router,       prefix="/api")
app.include_router(settings.router,   prefix="/api")
app.include_router(csv_import.router, prefix="/api")
app.include_router(products.router,   prefix="/api")
app.include_router(stores.router,     prefix="/api")
app.include_router(data_sources.router, prefix="/api")
app.include_router(analytics.router,        prefix="/api")
app.include_router(customer_analytics.router, prefix="/api")
