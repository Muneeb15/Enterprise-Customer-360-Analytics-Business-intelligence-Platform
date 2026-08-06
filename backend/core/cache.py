"""
Simple in-process TTL cache for expensive DB queries.
No Redis required — lives in memory per worker process.
Clears automatically when entries expire.

Usage:
    from backend.core.cache import cache

    @cache.ttl(seconds=30)
    async def my_expensive_query(org_id: str):
        ...
"""
from __future__ import annotations

import asyncio
import functools
import time
from typing import Any, Callable

_store: dict[str, tuple[Any, float]] = {}


def _make_key(fn_name: str, args: tuple, kwargs: dict) -> str:
    return f"{fn_name}:{args}:{sorted(kwargs.items())}"


class Cache:
    def ttl(self, seconds: int = 30) -> Callable:
        """Decorator: cache the async function result for `seconds`."""
        def decorator(fn: Callable) -> Callable:
            @functools.wraps(fn)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                key = _make_key(fn.__qualname__, args, kwargs)
                now = time.monotonic()

                if key in _store:
                    value, expires_at = _store[key]
                    if now < expires_at:
                        return value
                    del _store[key]

                result = await fn(*args, **kwargs)
                _store[key] = (result, now + seconds)
                return result

            wrapper.invalidate = lambda *a, **kw: _store.pop(  # type: ignore[attr-defined]
                _make_key(fn.__qualname__, a, kw), None
            )
            return wrapper
        return decorator

    def invalidate_all(self) -> None:
        _store.clear()


cache = Cache()
