"""
Seed fallback utility.

Wraps a DB service call with a typed fallback to seed data.
Distinguishes between:
  - DB empty (no rows)  → return seed
  - DB error            → log warning, return seed
  - DB has data         → return DB result
"""
from __future__ import annotations

import logging
from typing import Callable, TypeVar

T = TypeVar("T")

logger = logging.getLogger("nexus.fallback")


async def with_seed_fallback(
    db_call: Callable,
    seed_data,
    *,
    empty_check: Callable[[T], bool] | None = None,
):
    """
    Call `db_call()` (a coroutine).
    Return result if non-empty, else return seed_data.
    Catches all exceptions and logs them at WARNING level.
    """
    try:
        result = await db_call()
        if result is None:
            return seed_data
        if empty_check is not None and empty_check(result):
            return seed_data
        if isinstance(result, list) and len(result) == 0:
            return seed_data
        return result
    except Exception as exc:
        logger.warning("DB call failed, falling back to seed data: %s", exc)
        return seed_data
