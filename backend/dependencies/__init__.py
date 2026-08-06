"""
Single import point for all FastAPI dependencies.

Usage in routers:
    from backend.dependencies import get_db, get_current_user, CurrentUser
"""
from backend.db.session import get_db
from backend.core.auth import get_current_user, CurrentUser

__all__ = ["get_db", "get_current_user", "CurrentUser"]
