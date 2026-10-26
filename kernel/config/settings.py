"""Enterprise Configuration Loader for Innostes ERP Kernel.

Discovers .env files, aggregates domain-specific modular settings (database, security, etc.),
and exposes the cached singleton Settings instance.
"""

from functools import lru_cache
import os
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from kernel.config.db_settings import PostgresSettings
from kernel.config.env import find_env_files, parse_env_file
from kernel.config.security_settings import SecuritySettings


class Settings(BaseSettings):
    """Central Application & Infrastructure Settings."""

    app_name: str = Field(default="Innostes ERP API")
    app_env: str = Field(default="development")
    debug: bool = Field(default=False)

    db: PostgresSettings = Field(default_factory=PostgresSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)

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
        for env_path in find_env_files():
            file_vars = parse_env_file(env_path)
            for k, v in file_vars.items():
                if k not in merged_env:
                    merged_env[k] = v

        # System environment variables take top priority
        for k, v in os.environ.items():
            merged_env[k] = v

        app_kwargs: dict[str, Any] = {}
        if "APP_NAME" in merged_env:
            app_kwargs["app_name"] = merged_env["APP_NAME"]
        if "APP_ENV" in merged_env:
            app_kwargs["app_env"] = merged_env["APP_ENV"]
        if "APP_DEBUG" in merged_env:
            app_kwargs["debug"] = merged_env["APP_DEBUG"].lower() in ("true", "1", "yes")

        # Delegate parsing to domain-specific setting modules
        app_kwargs["db"] = PostgresSettings.from_env(merged_env)
        app_kwargs["security"] = SecuritySettings.from_env(merged_env)

        return cls(**app_kwargs)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton accessor for application settings."""
    return Settings.load()
