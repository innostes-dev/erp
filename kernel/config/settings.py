"""Application Settings Loader."""

from functools import lru_cache
import os
from typing import Any

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from kernel.config.env import find_env_files, parse_env_file
from kernel.database.db_settings import PostgresSettings


class Settings(BaseSettings):
    """Central Application Settings."""

    app_name: str = Field(default="Innostes ERP API")
    app_env: str = Field(default="development")
    debug: bool = Field(default=False)

    # JWT Settings
    jwt_secret_key: SecretStr = Field(default=SecretStr("insecure-dev-secret-key-change-in-production"))
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    refresh_token_expire_days: int = Field(default=7)

    # Database Settings from database/db_settings.py
    db: PostgresSettings = Field(default_factory=PostgresSettings)

    model_config = SettingsConfigDict(extra="ignore")

    @classmethod
    def load(cls) -> "Settings":
        """Load settings from discovered .env files and environment variables."""
        merged_env: dict[str, str] = {}
        for env_path in find_env_files():
            file_vars = parse_env_file(env_path)
            for k, v in file_vars.items():
                if k not in merged_env:
                    merged_env[k] = v

        for k, v in os.environ.items():
            merged_env[k] = v

        app_kwargs: dict[str, Any] = {}
        if "APP_NAME" in merged_env:
            app_kwargs["app_name"] = merged_env["APP_NAME"]
        if "APP_ENV" in merged_env:
            app_kwargs["app_env"] = merged_env["APP_ENV"]
        if "APP_DEBUG" in merged_env:
            app_kwargs["debug"] = merged_env["APP_DEBUG"].lower() in ("true", "1", "yes")
        if "JWT_SECRET_KEY" in merged_env:
            app_kwargs["jwt_secret_key"] = SecretStr(merged_env["JWT_SECRET_KEY"])
        if "JWT_ALGORITHM" in merged_env:
            app_kwargs["jwt_algorithm"] = merged_env["JWT_ALGORITHM"]
        if "ACCESS_TOKEN_EXPIRE_MINUTES" in merged_env:
            app_kwargs["access_token_expire_minutes"] = int(merged_env["ACCESS_TOKEN_EXPIRE_MINUTES"])
        if "REFRESH_TOKEN_EXPIRE_DAYS" in merged_env:
            app_kwargs["refresh_token_expire_days"] = int(merged_env["REFRESH_TOKEN_EXPIRE_DAYS"])

        # Load database settings from database/db_settings.py
        app_kwargs["db"] = PostgresSettings.from_env(merged_env)

        return cls(**app_kwargs)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton accessor for application settings."""
    return Settings.load()
