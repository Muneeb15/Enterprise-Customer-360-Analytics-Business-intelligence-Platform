"""
One-off script to create (or update) the first admin user.

Usage:
    python -m backend.scripts.create_admin --name "Sarah Jenkins" \
        --email sarah@acme.com --password changeme --org-id org_acme
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from backend.core.config import get_settings
from backend.core.security import hash_password
from backend.models.team_member import TeamMember


async def create_admin(name: str, email: str, password: str, org_id: str) -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with SessionLocal() as db:
        existing = (await db.execute(select(TeamMember).where(TeamMember.email == email))).scalar_one_or_none()
        if existing:
            existing.password_hash = hash_password(password)
            existing.role = "Admin"
            print(f"Updated existing user: {email}")
        else:
            db.add(TeamMember(
                org_id=org_id,
                name=name,
                email=email,
                role="Admin",
                last_active="Now",
                password_hash=hash_password(password),
            ))
            print(f"Created admin: {email}")
        await db.commit()

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--org-id", default="org_acme")
    args = parser.parse_args()
    asyncio.run(create_admin(args.name, args.email, args.password, args.org_id))
