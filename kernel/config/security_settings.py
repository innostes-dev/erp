"""Security and JWT Settings Schema and Environment Parser."""

from typing import Any
from pydantic import BaseModel, Field, SecretStr


class SecuritySettings(BaseModel):
    """Enterprise Security & JWT Configuration."""

    jwt_secret_key: SecretStr = Field(
        default=SecretStr("insecure-dev-secret-key-change-in-production-min32chars"),
        description="Secret key used for signing and verifying JWT tokens",
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT cryptographic signing algorithm",
    )
    access_token_expire_minutes: int = Field(
        default=30,
        ge=1,
        description="Access token lifespan in minutes",
    )
    refresh_token_expire_days: int = Field(
        default=7,
        ge=1,
        description="Refresh token lifespan in days",
    )

    @classmethod
    def from_env(cls, env: dict[str, str]) -> "SecuritySettings":
        """Extract security settings from a raw environment dictionary."""
        kwargs: dict[str, Any] = {}
        if "JWT_SECRET_KEY" in env:
            kwargs["jwt_secret_key"] = SecretStr(env["JWT_SECRET_KEY"])
        if "JWT_ALGORITHM" in env:
            kwargs["jwt_algorithm"] = env["JWT_ALGORITHM"]
        if "ACCESS_TOKEN_EXPIRE_MINUTES" in env:
            kwargs["access_token_expire_minutes"] = int(env["ACCESS_TOKEN_EXPIRE_MINUTES"])
        if "REFRESH_TOKEN_EXPIRE_DAYS" in env:
            kwargs["refresh_token_expire_days"] = int(env["REFRESH_TOKEN_EXPIRE_DAYS"])
        return cls(**kwargs)
