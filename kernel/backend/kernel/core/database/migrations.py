"""Database migration utilities (Alembic) used at startup and by first-run setup."""

import asyncio
import logging
from pathlib import Path
import threading

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger("kernel.core.database.migrations")

# Alembic keeps global state while running, so two upgrades in one process at
# the same time break it. Across processes, migrations/env.py takes a Postgres
# advisory lock.
_upgrade_lock = threading.Lock()


def get_alembic_config() -> Config:
    """Return the Alembic config for the kernel (`kernel/backend/alembic.ini`)."""
    ini_path = Path(__file__).resolve().parents[3] / "alembic.ini"
    return Config(str(ini_path))


def apply_migrations() -> None:
    """Upgrade the database to the latest revision (`alembic upgrade head`).

    Blocking; call it from a worker thread in async code.

    Raises:
        Exception: Whatever Alembic raises if a migration fails.
    """
    with _upgrade_lock:
        command.upgrade(get_alembic_config(), "head")


async def run_migrations() -> None:
    """Upgrade the database to the latest revision without blocking the event loop.

    Raises:
        Exception: Whatever Alembic raises if a migration fails.
    """
    await asyncio.to_thread(apply_migrations)


async def auto_migrate() -> bool:
    """Run migrations at startup, logging (not raising) on failure.

    Returns:
        True if migrations succeeded, False if they failed or were skipped.
    """
    try:
        await run_migrations()
        logger.info("Database migrations applied successfully.")
        return True
    except Exception as exc:
        logger.warning("Database auto-migration skipped or failed: %s", exc)
        return False


async def pending_migrations(engine: AsyncEngine) -> list[str]:
    """List migration revisions not yet applied to the database.

    Args:
        engine: Engine connected to the target database.

    Returns:
        Revision ids still to apply, oldest first. Empty if up to date.
    """
    script = ScriptDirectory.from_config(get_alembic_config())

    async with engine.connect() as conn:
        current = await conn.run_sync(
            lambda sync_conn: MigrationContext.configure(sync_conn).get_current_heads()
        )

    pending = [
        rev.revision
        for rev in script.iterate_revisions(script.get_heads(), current or None)
        if rev.revision not in current
    ]
    return list(reversed(pending))
