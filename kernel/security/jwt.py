"""JWT Generation and Verification."""

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from kernel.config import get_settings


def create_access_token(
    payload: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a JWT access token with payload."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))

    to_encode = payload.copy()
    to_encode.update({
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    })

    return jwt.encode(
        to_encode,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(
    payload: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a JWT refresh token with payload."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.refresh_token_expire_days))

    to_encode = payload.copy()
    to_encode.update({
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    })

    return jwt.encode(
        to_encode,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token."""
    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret_key.get_secret_value(),
        algorithms=[settings.jwt_algorithm],
    )
