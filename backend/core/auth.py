"""
FastAPI dependency for Clerk JWT authentication.

Every protected endpoint calls `get_current_user` as a dependency.
It verifies the Bearer token from Clerk, returns the user's clerk_user_id,
and the org_id tied to that user in our database.

In development (APP_ENV=development), authentication is optional —
missing or invalid tokens fall back to the default dev org.
"""
from __future__ import annotations

import httpx
from functools import lru_cache
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import get_settings
from backend.db.session import get_db
from backend.models.team_member import TeamMember
from backend.models.org import Org

bearer_scheme = HTTPBearer(auto_error=False)

CLERK_JWKS_URL = "https://api.clerk.dev/v1/jwks"


@lru_cache(maxsize=1)
def _get_jwks() -> dict[str, Any]:
    """Fetch Clerk's public JWKS (cached per process — refreshes on restart)."""
    settings = get_settings()
    secret_key = getattr(settings, "clerk_secret_key", None)
    if not secret_key:
        return {}
    headers = {"Authorization": f"Bearer {secret_key}"}
    resp = httpx.get(CLERK_JWKS_URL, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _verify_clerk_token(token: str) -> dict[str, Any]:
    """Decode and verify a Clerk JWT. Returns the payload."""
    try:
        # Decode without verification first to get the kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        jwks = _get_jwks()
        keys = jwks.get("keys", [])
        public_key = next((k for k in keys if k.get("kid") == kid), None)

        if not public_key:
            raise ValueError("Key not found in JWKS")

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        ) from exc


class CurrentUser:
    def __init__(self, clerk_user_id: str, org_id: str, email: str | None = None):
        self.clerk_user_id = clerk_user_id
        self.org_id = org_id
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    settings = get_settings()

    # ── Development fallback ──────────────────────────────────────────────────
    if settings.is_dev and not credentials:
        return CurrentUser(
            clerk_user_id="dev_user",
            org_id="org_acme",
            email="dev@example.com",
        )

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Verify Clerk token ────────────────────────────────────────────────────
    payload = _verify_clerk_token(credentials.credentials)
    clerk_user_id: str = payload.get("sub", "")
    email: str | None = payload.get("email")

    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )

    # ── Look up the user's org in our DB ──────────────────────────────────────
    member = (
        await db.execute(
            select(TeamMember).where(TeamMember.clerk_user_id == clerk_user_id)
        )
    ).scalar_one_or_none()

    if member:
        return CurrentUser(
            clerk_user_id=clerk_user_id,
            org_id=member.org_id,
            email=member.email,
        )

    # ── Auto-provision: first sign-in creates org + member ───────────────────
    org = Org(name=email.split("@")[0].capitalize() + "'s Workspace" if email else "My Workspace")
    db.add(org)
    await db.flush()

    new_member = TeamMember(
        org_id=org.id,
        name=email.split("@")[0].capitalize() if email else "User",
        email=email or f"{clerk_user_id}@unknown.com",
        role="Admin",
        last_active="Now",
        clerk_user_id=clerk_user_id,
    )
    db.add(new_member)
    await db.commit()

    return CurrentUser(
        clerk_user_id=clerk_user_id,
        org_id=org.id,
        email=email,
    )


# Alias — use this in routers that don't need the full user object
async def require_auth(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return user
