"""Database Migration Utilities."""

import asyncio
import logging
from pathlib import Path
from alembic import command
from alembic.config import Config

logger = logging.getLogger("kernel.database.migrations")


def apply_migrations() -> None:
    """Run alembic upgrade head."""
    ini_path = Path(__file__).resolve().parents[1] / "alembic.ini"
    cfg = Config(str(ini_path))
    command.upgrade(cfg, "head")


async def auto_migrate() -> bool:
    """Run database migrations in a worker thread.

    Returns True if migrations succeeded, False if skipped/failed.
    """
    try:
        await asyncio.to_thread(apply_migrations)
        logger.info("Database migrations applied successfully.")
        return True
    except Exception as exc:
        logger.warning("Database auto-migration skipped or failed: %s", exc)
        return False
