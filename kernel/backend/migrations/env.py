import asyncio
from logging.config import fileConfig
from sqlalchemy import String, pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from kernel.core.config import get_settings
from kernel.core.database import Base
import kernel.models  # noqa: F401  (registers all tables for autogenerate)

config = context.config

if config.config_file_name is not None:
    # Keep the API server's loggers working when setup runs migrations in-process.
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# Set model metadata for autogenerate support
target_metadata = Base.metadata

# Inject database URL from kernel settings
settings = get_settings()
config.set_main_option(
    "sqlalchemy.url",
    settings.db.async_url.render_as_string(hide_password=False),
)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        version_table_col_type=String(128),
    )

    with context.begin_transaction():
        context.run_migrations()


# Any constant: identifies "kernel migrations" for pg_advisory_xact_lock.
MIGRATION_LOCK_ID = 727_001


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        version_table_col_type=String(128),
    )

    with context.begin_transaction():
        # Only one process migrates at a time (other API workers, replicas, the setup
        # CLI). Others wait here, then find nothing left to do. Released at commit.
        connection.execute(text("SELECT pg_advisory_xact_lock(:id)"), {"id": MIGRATION_LOCK_ID})
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async connection."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
