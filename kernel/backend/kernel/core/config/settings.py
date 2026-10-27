"""Application Settings Loader."""

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from kernel.core.config.env import load_env
from kernel.core.database.db_settings import PostgresSettings

# kernel/backend/var: runtime files that must not be committed (gitignored)
RUNTIME_DIR = Path(__file__).resolve().parents[3] / "var"


class Settings(BaseSettings):
    """Central Application Settings."""

    app_name: str = Field(default="Innostes ERP API")
    app_version: str = Field(default="0.1.0", description="API version shown in the API docs")
    app_env: str = Field(default="development")
    port: int = Field(default=8001, ge=1, le=65535, description="API server port")
    debug: bool = Field(default=False)
    auto_migrate: bool = Field(default=False, description="Run database migrations automatically on startup")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:4200", "http://127.0.0.1:4200"],
        description="Browser origins allowed to call the API (the web-app URL). Comma-separated in CORS_ORIGINS.",
    )

    # First-run setup (see kernel.setup)
    setup_enabled: bool = Field(
        default=True,
        description="Allow first-run setup through the web wizard. Set false in production to allow "
        "only the command-line installer (python -m kernel.setup).",
    )
    setup_token: SecretStr | None = Field(
        default=None,
        description="One-time token the web wizard must send. If unset, one is generated into "
        "setup_token_file and printed in the server log.",
    )
    setup_token_file: Path = Field(
        default=RUNTIME_DIR / "setup-token",
        description="Where the generated setup token is stored until setup completes.",
    )

    # JWT Settings
    jwt_secret_key: SecretStr = Field(default=SecretStr("insecure-dev-secret-key-change-in-production"))
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    refresh_token_expire_days: int = Field(default=7)

    # Auth Security Policies & Expirations
    frontend_url: str = Field(default="http://localhost:4200", description="Frontend base URL for password reset links")
    password_reset_token_expire_minutes: int = Field(default=60, description="Reset link validity in minutes")
    temp_password_expire_hours: int = Field(default=24, description="Temporary password validity in hours")
    max_failed_login_attempts: int = Field(default=5, description="Failed attempts before temporary lockout")
    account_lockout_minutes: int = Field(default=15, description="Duration of brute-force lockout")

    # Email & SMTP Settings
    smtp_host: str | None = Field(default=None, description="SMTP host (None = console logger in dev)")
    smtp_port: int = Field(default=587, description="SMTP port (587 for STARTTLS, 465 for SSL)")
    smtp_username: str | None = Field(default=None, description="SMTP auth username")
    smtp_password: SecretStr | None = Field(default=None, description="SMTP auth password")
    smtp_from: str = Field(default="Innostes ERP <noreply@innostes.com>", description="Sender address")
    smtp_use_tls: bool = Field(default=True, description="Enable STARTTLS for SMTP")

    # Envelope Encryption & Key Rotation Settings
    encryption_current_key_version: int = Field(default=1, description="Active key version used for new encryptions")
    encryption_keys: dict[int, SecretStr] = Field(
        default_factory=lambda: {
            1: SecretStr("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
        },
        description="Keyring mapping version int -> 32-byte hex/base64 key",
    )
    blind_index_pepper: SecretStr = Field(
        default=SecretStr("fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"),
        description="Secret HMAC pepper for blind indexes",
    )

    # Database Settings from database/db_settings.py
    db: PostgresSettings = Field(default_factory=PostgresSettings)

    model_config = SettingsConfigDict(extra="ignore")

    @classmethod
    def settings_customise_sources(cls, settings_cls, init_settings, *args, **kwargs):  # type: ignore[override]
        """Use only the values passed in.

        `Settings.load()` already merges `.env` files and environment variables
        and parses them (e.g. comma-separated `CORS_ORIGINS`). Letting
        pydantic-settings also read the environment would make it try to parse
        list fields as JSON and crash at startup.
        """
        return (init_settings,)

    @classmethod
    def load(cls) -> "Settings":
        """Load settings from discovered .env files and environment variables."""
        merged_env = load_env()

        app_kwargs: dict[str, Any] = {}
        if "APP_NAME" in merged_env:
            app_kwargs["app_name"] = merged_env["APP_NAME"]
        if "APP_VERSION" in merged_env:
            app_kwargs["app_version"] = merged_env["APP_VERSION"]
        if "APP_ENV" in merged_env:
            app_kwargs["app_env"] = merged_env["APP_ENV"]
        if "PORT" in merged_env:
            app_kwargs["port"] = int(merged_env["PORT"])
        if "APP_DEBUG" in merged_env:
            app_kwargs["debug"] = merged_env["APP_DEBUG"].lower() in ("true", "1", "yes")
        if "CORS_ORIGINS" in merged_env:
            app_kwargs["cors_origins"] = [
                o.strip() for o in merged_env["CORS_ORIGINS"].split(",") if o.strip()
            ]
        if "SETUP_ENABLED" in merged_env:
            app_kwargs["setup_enabled"] = merged_env["SETUP_ENABLED"].lower() in ("true", "1", "yes")
        if merged_env.get("SETUP_TOKEN"):
            app_kwargs["setup_token"] = SecretStr(merged_env["SETUP_TOKEN"])
        if merged_env.get("SETUP_TOKEN_FILE"):
            app_kwargs["setup_token_file"] = Path(merged_env["SETUP_TOKEN_FILE"])
        if "AUTO_MIGRATE" in merged_env:
            app_kwargs["auto_migrate"] = merged_env["AUTO_MIGRATE"].lower() in ("true", "1", "yes")
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
