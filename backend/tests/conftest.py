"""
Pytest fixtures shared across unit and integration tests.
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.db.base import Base
from backend.db.session import get_db
from backend.core.auth import CurrentUser, get_current_user
from backend.main import app

# Import all models so Base.metadata knows every table before create_all
import backend.models.org             # noqa: F401
import backend.models.team_member     # noqa: F401
import backend.models.customer        # noqa: F401
import backend.models.product         # noqa: F401
import backend.models.transaction     # noqa: F401
import backend.models.campaign        # noqa: F401
import backend.models.revenue_snapshot  # noqa: F401
import backend.models.report          # noqa: F401
import backend.models.job             # noqa: F401
import backend.models.import_log      # noqa: F401

# In-memory SQLite for tests (no Postgres required)
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

# Fixed test user that all integration tests run as
TEST_USER = CurrentUser(
    clerk_user_id="test_clerk_user",
    org_id="org_acme",
    email="test@example.com",
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    SessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTP test client with DB + auth dependencies overridden."""

    async def _override_get_db():
        yield db_session

    async def _override_get_current_user():
        return TEST_USER

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
