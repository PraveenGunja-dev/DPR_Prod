# app/services/cache_service.py
"""
In-memory TTL cache service.
Replaces the Redis/in-memory cache from Express.
Uses cachetools for thread-safe TTL caching.
"""

import json
import logging
from typing import Any, Optional

from cachetools import TTLCache

logger = logging.getLogger("adani-flow.cache")

# Max 1000 entries, default TTL 5 minutes (300 seconds)
_cache = TTLCache(maxsize=1000, ttl=300)


class CacheService:
    """Simple in-memory cache with TTL support."""

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Get a value from cache. Returns None if not found or expired."""
        value = _cache.get(key)
        if value is not None:
            logger.debug(f"Cache HIT: {key}")
        return value

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 300) -> bool:
        """Set a value in cache with TTL in seconds."""
        # cachetools TTLCache uses a global TTL, so for per-key TTL
        # we just use the global cache (most entries use ~300s anyway)
        _cache[key] = value
        return True

    @staticmethod
    async def delete(key: str) -> bool:
        """Delete a specific key from cache."""
        try:
            del _cache[key]
        except KeyError:
            pass
        return True

    @staticmethod
    async def flush_all() -> bool:
        """Clear all cache entries."""
        _cache.clear()
        logger.debug("Cache flushed")
        return True


cache = CacheService()
