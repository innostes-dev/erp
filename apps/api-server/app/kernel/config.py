"""Enterprise Configuration for Innostes ERP.

Manages application and PostgreSQL settings with automated .env file discovery,
environment variable precedence, type validation, connection pool limits, and credential masking.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


def _find_env_files() -> list[Path]:
    """Find candidate .env files in app directory, parent directories, and current working directory."""
    candidates = [
        # App-specific .env (apps/api-server/.env)
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env.local",
        # Current working directory .env
        Path.cwd() / ".env",
        Path.cwd() / ".env.local",
        # Repository root .env (if different from cwd)
        Path(__file__).resolve().parents[3] / ".env" if len(Path(__file__).resolve().parents) > 3 else None,
    ]
    seen = set()
    valid_paths: list[Path] = []
    for candidate in candidates:
        if candidate and candidate.is_file() and candidate.resolve() not in seen:
            seen.add(candidate.resolve())
            valid_paths.append(candidate)
    return valid_paths


def _parse_env_file(filepath: Path) -> dict[str, str]:
    """Parse a .env file into key-value pairs without requiring external libraries."""
    env_vars: dict[str, str] = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    # Strip surrounding quotes if present
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    env_vars[key] = val
    except Exception:
        pass
    return env_vars


class PostgresSettings(BaseModel):
    """PostgreSQL connection & pool configuration."""

    host: str = Field(default="localhost", description="PostgreSQL host")
    port: int = Field(default=5432, ge=1, le=65535, description="PostgreSQL port")
    user: str = Field(default="postgres", description="Database username")
    password: SecretStr = Field(default=SecretStr("postgres"), description="Database password")
    database: str = Field(default="erp_dev", description="Database name")
    schema_name: str = Field(default="public", description="Default search schema")
    ssl_mode: str = Field(default="prefer", description="SSL mode")

    # Production-ready connection pool tuning
    pool_size: int = Field(default=20, ge=1, le=100, description="Base pool connections")
    max_overflow: int = Field(default=10, ge=0, le=50, description="Surge connections beyond pool_size")
    pool_timeout: float = Field(default=30.0, description="Connection checkout timeout (seconds)")
    pool_recycle: int = Field(default=1800, description="Recycle connections older than 30 mins")
    pool_pre_ping: bool = Field(default=True, description="Ping connection on checkout to avoid stale drops")
    echo_sql: bool = Field(default=False, description="Log emitted SQL statements")

    @property
    def async_url(self) -> URL:
        """Construct a strongly-typed asyncpg SQLAlchemy URL."""
        query_params = {}
        if self.ssl_mode and self.ssl_mode != "prefer":
            query_params["ssl"] = self.ssl_mode

        return URL.create(
            drivername="postgresql+asyncpg",
            username=self.user,
            password=self.password.get_secret_value(),
            host=self.host,
            port=self.port,
            database=self.database,
            query=query_params,
        )

    @property
    def masked_url(self) -> str:
        """Safe connection string with password hidden for logging."""
        return self.async_url.render_as_string(hide_password=True)


class Settings(BaseSettings):
    """Central Application & Infrastructure Settings."""

    app_name: str = Field(default="Innostes ERP API")
    app_env: str = Field(default="development")
    debug: bool = Field(default=False)

    db: PostgresSettings = Field(default_factory=PostgresSettings)

    model_config = SettingsConfigDict(
        extra="ignore",
    )

    @classmethod
    def load(cls) -> "Settings":
        """Load settings from discovered .env files and os.environ.

        Priority order (highest to lowest):
        1. System environment variables (os.environ)
        2. .env.local file
        3. .env file
        4. Class defaults
        """
        # Collect merged environment dictionary from discovered .env files
        merged_env: dict[str, str] = {}
        for env_path in _find_env_files():
            file_vars = _parse_env_file(env_path)
            # Earlier files in search order override later ones if already found
            for k, v in file_vars.items():
                if k not in merged_env:
                    merged_env[k] = v

        # System environment variables take top priority
        for k, v in os.environ.items():
            merged_env[k] = v

        db_kwargs: dict[str, Any] = {}
        if "DB_HOST" in merged_env:
            db_kwargs["host"] = merged_env["DB_HOST"]
        if "DB_PORT" in merged_env:
            db_kwargs["port"] = int(merged_env["DB_PORT"])
        if "DB_USER" in merged_env:
            db_kwargs["user"] = merged_env["DB_USER"]
        if "DB_PASSWORD" in merged_env:
            db_kwargs["password"] = SecretStr(merged_env["DB_PASSWORD"])
        if "DB_NAME" in merged_env:
            db_kwargs["database"] = merged_env["DB_NAME"]
        if "DB_SCHEMA" in merged_env:
            db_kwargs["schema_name"] = merged_env["DB_SCHEMA"]
        if "DB_SSL_MODE" in merged_env:
            db_kwargs["ssl_mode"] = merged_env["DB_SSL_MODE"]
        if "DB_POOL_SIZE" in merged_env:
            db_kwargs["pool_size"] = int(merged_env["DB_POOL_SIZE"])
        if "DB_MAX_OVERFLOW" in merged_env:
            db_kwargs["max_overflow"] = int(merged_env["DB_MAX_OVERFLOW"])
        if "DB_POOL_TIMEOUT" in merged_env:
            db_kwargs["pool_timeout"] = float(merged_env["DB_POOL_TIMEOUT"])
        if "DB_POOL_RECYCLE" in merged_env:
            db_kwargs["pool_recycle"] = int(merged_env["DB_POOL_RECYCLE"])
        if "DB_POOL_PRE_PING" in merged_env:
            db_kwargs["pool_pre_ping"] = merged_env["DB_POOL_PRE_PING"].lower() in ("true", "1", "yes")
        if "DB_ECHO_SQL" in merged_env:
            db_kwargs["echo_sql"] = merged_env["DB_ECHO_SQL"].lower() in ("true", "1", "yes")

        app_kwargs: dict[str, Any] = {}
        if "APP_NAME" in merged_env:
            app_kwargs["app_name"] = merged_env["APP_NAME"]
        if "APP_ENV" in merged_env:
            app_kwargs["app_env"] = merged_env["APP_ENV"]
        if "APP_DEBUG" in merged_env:
            app_kwargs["debug"] = merged_env["APP_DEBUG"].lower() in ("true", "1", "yes")

        if db_kwargs:
            app_kwargs["db"] = PostgresSettings(**db_kwargs)

        return cls(**app_kwargs)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton accessor for application settings."""
    return Settings.load()
