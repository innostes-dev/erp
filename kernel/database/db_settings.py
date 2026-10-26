"""Database Settings."""

from typing import Any
from pydantic import BaseModel, Field, SecretStr
from sqlalchemy import URL


class PostgresSettings(BaseModel):
    """PostgreSQL connection & pool configuration."""

    host: str = Field(default="localhost", description="PostgreSQL host")
    port: int = Field(default=5432, ge=1, le=65535, description="PostgreSQL port")
    user: str = Field(default="postgres", description="Database username")
    password: SecretStr = Field(default=SecretStr("postgres"), description="Database password")
    database: str = Field(default="erp_dev", description="Database name")
    schema_name: str = Field(default="public", description="Default search schema")
    ssl_mode: str = Field(default="prefer", description="SSL mode")

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

    @classmethod
    def from_env(cls, env: dict[str, str]) -> "PostgresSettings":
        """Extract database settings from environment."""
        kwargs: dict[str, Any] = {}
        if "DB_HOST" in env:
            kwargs["host"] = env["DB_HOST"]
        if "DB_PORT" in env:
            kwargs["port"] = int(env["DB_PORT"])
        if "DB_USER" in env:
            kwargs["user"] = env["DB_USER"]
        if "DB_PASSWORD" in env:
            kwargs["password"] = SecretStr(env["DB_PASSWORD"])
        if "DB_NAME" in env:
            kwargs["database"] = env["DB_NAME"]
        if "DB_SCHEMA" in env:
            kwargs["schema_name"] = env["DB_SCHEMA"]
        if "DB_SSL_MODE" in env:
            kwargs["ssl_mode"] = env["DB_SSL_MODE"]
        if "DB_POOL_SIZE" in env:
            kwargs["pool_size"] = int(env["DB_POOL_SIZE"])
        if "DB_MAX_OVERFLOW" in env:
            kwargs["max_overflow"] = int(env["DB_MAX_OVERFLOW"])
        if "DB_POOL_TIMEOUT" in env:
            kwargs["pool_timeout"] = float(env["DB_POOL_TIMEOUT"])
        if "DB_POOL_RECYCLE" in env:
            kwargs["pool_recycle"] = int(env["DB_POOL_RECYCLE"])
        if "DB_POOL_PRE_PING" in env:
            kwargs["pool_pre_ping"] = env["DB_POOL_PRE_PING"].lower() in ("true", "1", "yes")
        if "DB_ECHO_SQL" in env:
            kwargs["echo_sql"] = env["DB_ECHO_SQL"].lower() in ("true", "1", "yes")
        return cls(**kwargs)
