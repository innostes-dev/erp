"""Non-blocking Asynchronous Batch Accumulator & Worker for API Logs (Redis + In-Memory Fallback)."""

import asyncio
from datetime import date, datetime
import json
import logging
import os
from typing import Any
import uuid
from sqlalchemy import insert

from tracura.models.log import ApiLog

logger = logging.getLogger("tracura.buffer")


def _json_serial(obj: Any) -> Any:
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")


def _deserialize_item(data: dict[str, Any]) -> dict[str, Any]:
    """Restore native Python types (UUID, datetime) from JSON dict."""
    uuid_fields = ("id", "tenant_id", "project_id", "environment_id", "api_key_id")
    for field in uuid_fields:
        val = data.get(field)
        if val and isinstance(val, str):
            try:
                data[field] = uuid.UUID(val)
            except (ValueError, TypeError):
                pass
    created_at = data.get("created_at")
    if created_at and isinstance(created_at, str):
        try:
            data["created_at"] = datetime.fromisoformat(created_at)
        except (ValueError, TypeError):
            pass
    return data


class LogBuffer:
    """Asynchronous hybrid queue buffer that supports Redis queue with in-memory fallback."""

    def __init__(
        self,
        max_batch_size: int = 100,
        flush_interval_seconds: float = 1.0,
        max_queue_size: int = 10000,
        redis_url: str | None = None,
        redis_queue_key: str = "tracura:logs:queue",
        redis_live_channel: str = "tracura:logs:live",
    ) -> None:
        self.max_batch_size = max_batch_size
        self.flush_interval_seconds = flush_interval_seconds
        self.max_queue_size = max_queue_size
        self.redis_url = redis_url or os.getenv("TRACURA_REDIS_URL") or os.getenv("REDIS_URL")
        self.redis_queue_key = redis_queue_key
        self.redis_live_channel = redis_live_channel

        self.queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=max_queue_size)
        self._worker_task: asyncio.Task[None] | None = None
        self._running: bool = False
        self._driver: str = "memory"
        self._redis_client: Any = None

    @property
    def driver(self) -> str:
        """Current active buffer driver ('redis' or 'memory')."""
        return self._driver

    async def get_queue_size(self) -> int:
        """Return the count of currently buffered items."""
        if self._driver == "redis" and self._redis_client:
            try:
                return await self._redis_client.llen(self.redis_queue_key)
            except Exception:
                pass
        return self.queue.qsize()

    async def _init_redis(self) -> bool:
        """Attempt to connect to Redis. If unavailable, smoothly fall back to in-memory mode."""
        if not self.redis_url:
            self._driver = "memory"
            self._redis_client = None
            return False

        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.5,
            )
            await client.ping()
            self._redis_client = client
            self._driver = "redis"
            masked_url = self.redis_url.split("@")[-1] if "@" in self.redis_url else self.redis_url
            logger.info("Tracura buffer successfully connected to Redis queue at %s (key=%s)", masked_url, self.redis_queue_key)
            return True
        except Exception as exc:
            logger.warning(
                "Tracura Redis buffer unavailable (%s). Defaulting to in-memory asynchronous buffer.",
                str(exc) or type(exc).__name__,
            )
            self._driver = "memory"
            self._redis_client = None
            return False

    def start(self) -> None:
        """Start the background flush worker loop."""
        if self._running and self._worker_task and not self._worker_task.done():
            return
        self._running = True
        self._worker_task = asyncio.create_task(self._run_worker())
        logger.info(
            "Tracura buffer worker started (driver=%s, batch=%d, interval=%.1fs)",
            self._driver,
            self.max_batch_size,
            self.flush_interval_seconds,
        )

    async def _run_worker(self) -> None:
        """Initialize Redis connection if configured, then enter main flush loop."""
        await self._init_redis()
        await self._flush_loop()

    async def stop(self) -> None:
        """Gracefully stop worker and flush remaining items."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None

        # Drain remaining logs
        await self.flush()

        if self._redis_client:
            try:
                await self._redis_client.aclose()
            except Exception:
                pass
            self._redis_client = None

        logger.info("Tracura buffer worker stopped and drained.")

    async def enqueue(self, log_dict: dict[str, Any]) -> bool:
        """Enqueue a log dictionary to Redis (if available) or fallback in-memory ring buffer."""
        if "id" not in log_dict or not log_dict["id"]:
            log_dict["id"] = uuid.uuid4()

        # 1. Try Redis queue
        if self._driver == "redis" and self._redis_client:
            try:
                payload = json.dumps(log_dict, default=_json_serial)
                await self._redis_client.rpush(self.redis_queue_key, payload)
                # Broadcast for live tailing subscribers
                try:
                    await self._redis_client.publish(self.redis_live_channel, payload)
                except Exception:
                    pass
                return True
            except Exception as exc:
                logger.warning("Redis enqueue failed (%s), falling back to in-memory queue", exc)
                # Fallback to local queue on transient Redis error

        # 2. In-memory fallback queue
        try:
            self.queue.put_nowait(log_dict)
            return True
        except asyncio.QueueFull:
            logger.warning("Tracura in-memory buffer queue full! Dropping log %s", log_dict.get("correlation_id"))
            return False

    async def enqueue_batch(self, log_dicts: list[dict[str, Any]]) -> int:
        """Enqueue multiple log dicts. Returns count of successfully enqueued items."""
        count = 0
        for item in log_dicts:
            if await self.enqueue(item):
                count += 1
        return count

    async def flush(self) -> int:
        """Drain all currently queued items (from both Redis and memory) and commit to database in bulk."""
        items: list[dict[str, Any]] = []

        # 1. Drain from Redis if active
        if self._driver == "redis" and self._redis_client:
            try:
                raw_items = await self._redis_client.lpop(self.redis_queue_key, self.max_batch_size * 5)
                if raw_items:
                    if isinstance(raw_items, str):
                        raw_items = [raw_items]
                    for raw in raw_items:
                        try:
                            items.append(_deserialize_item(json.loads(raw)))
                        except Exception:
                            pass
            except Exception as exc:
                logger.warning("Error draining Redis queue on flush: %s", exc)

        # 2. Drain from in-memory queue
        while not self.queue.empty():
            try:
                items.append(self.queue.get_nowait())
            except asyncio.QueueEmpty:
                break

        if not items:
            return 0

        await self._persist_batch(items)
        return len(items)

    async def _flush_loop(self) -> None:
        """Background worker that commits batches periodically from Redis or in-memory queue."""
        while self._running:
            try:
                items: list[dict[str, Any]] = []

                # 1. Pop from Redis if driver is redis
                if self._driver == "redis" and self._redis_client:
                    try:
                        raw_items = await self._redis_client.lpop(self.redis_queue_key, self.max_batch_size)
                        if raw_items:
                            if isinstance(raw_items, str):
                                raw_items = [raw_items]
                            for raw in raw_items:
                                try:
                                    items.append(_deserialize_item(json.loads(raw)))
                                except Exception:
                                    pass
                    except Exception as exc:
                        logger.warning("Error reading from Redis queue: %s. Falling back to local memory queue.", exc)

                # 2. Pop from in-memory queue (also processes items if driver is memory or fallback items)
                # If nothing popped from Redis and in-memory queue is empty, wait for an item
                if not items and self.queue.empty():
                    try:
                        item = await asyncio.wait_for(self.queue.get(), timeout=self.flush_interval_seconds)
                        items.append(item)
                    except asyncio.TimeoutError:
                        continue

                while len(items) < self.max_batch_size and not self.queue.empty():
                    try:
                        items.append(self.queue.get_nowait())
                    except asyncio.QueueEmpty:
                        break

                if items:
                    await self._persist_batch(items)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Unexpected error in Tracura buffer loop: %s", exc, exc_info=True)
                await asyncio.sleep(0.5)

    async def _persist_batch(self, items: list[dict[str, Any]]) -> None:
        """Execute bulk insert to PostgreSQL database."""
        if not items:
            return
        try:
            from kernel.core.database.session import get_sessionmaker
            sessionmaker = get_sessionmaker()
            async with sessionmaker() as session:
                async with session.begin():
                    stmt = insert(ApiLog).values(items)
                    await session.execute(stmt)
            logger.debug("Successfully persisted %d API logs to database.", len(items))
        except Exception as exc:
            logger.error("Failed to persist batch of %d logs to database: %s", len(items), exc, exc_info=True)


# Global singleton log buffer
log_buffer = LogBuffer()
