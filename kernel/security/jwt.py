"""JSON Web Token (JWT) Generation, Refresh Token, and Verification Utility."""

from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

import jwt

from kernel.config import Settings, get_settings
from kernel.security.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    TokenTypeMismatchError,
)
from kernel.security.schemas import TokenPair, TokenPayload, TokenType


def create_token(
    subject: str | int,
    token_type: str | TokenType,
    payload: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
    settings: Settings | None = None,
) -> str:
    """Generate a signed JWT token with standard and custom claims."""
    cfg = settings or get_settings()
    now = datetime.now(timezone.utc)
    token_type_val = str(token_type.value if isinstance(token_type, TokenType) else token_type)

    if expires_delta is not None:
        expire = now + expires_delta
    elif token_type_val == TokenType.REFRESH.value:
        expire = now + timedelta(days=cfg.security.refresh_token_expire_days)
    else:
        expire = now + timedelta(minutes=cfg.security.access_token_expire_minutes)

    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type_val,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
    }

    # Merge custom application payload claims
    if payload:
        reserved_keys = {"sub", "type", "iat", "nbf", "exp", "jti"}
        for key, val in payload.items():
            if key not in reserved_keys:
                to_encode[key] = val

    secret = cfg.security.jwt_secret_key.get_secret_value()
    algorithm = cfg.security.jwt_algorithm

    return jwt.encode(to_encode, secret, algorithm=algorithm)


def create_access_token(
    subject: str | int,
    payload: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
    settings: Settings | None = None,
) -> str:
    """Generate a short-lived access token with custom payload."""
    return create_token(
        subject=subject,
        token_type=TokenType.ACCESS,
        payload=payload,
        expires_delta=expires_delta,
        settings=settings,
    )


def create_refresh_token(
    subject: str | int,
    payload: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
    settings: Settings | None = None,
) -> str:
    """Generate a long-lived refresh token."""
    return create_token(
        subject=subject,
        token_type=TokenType.REFRESH,
        payload=payload,
        expires_delta=expires_delta,
        settings=settings,
    )


def create_token_pair(
    subject: str | int,
    payload: dict[str, Any] | None = None,
    settings: Settings | None = None,
) -> TokenPair:
    """Generate an (access_token, refresh_token) pair."""
    cfg = settings or get_settings()
    access_token = create_access_token(subject, payload=payload, settings=cfg)
    refresh_token = create_refresh_token(subject, payload=payload, settings=cfg)
    expires_in = cfg.security.access_token_expire_minutes * 60

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in,
    )


def decode_token(
    token: str,
    verify_exp: bool = True,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Decode and cryptographically verify a JWT.

    Raises:
        TokenExpiredError: If the token has passed its expiration time.
        InvalidTokenError: If signature verification fails or token is malformed.
    """
    cfg = settings or get_settings()
    secret = cfg.security.jwt_secret_key.get_secret_value()
    algorithm = cfg.security.jwt_algorithm

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=[algorithm],
            options={"verify_exp": verify_exp},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise InvalidTokenError(str(exc)) from exc


def verify_token(
    token: str,
    expected_type: str | TokenType | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Decode, verify expiration, and validate token type ('access' or 'refresh').

    Raises:
        TokenExpiredError: If token is expired.
        TokenTypeMismatchError: If token type does not match expected_type.
        InvalidTokenError: If token is otherwise invalid.
    """
    claims = decode_token(token, verify_exp=True, settings=settings)

    if expected_type is not None:
        expected = str(expected_type.value if isinstance(expected_type, TokenType) else expected_type)
        actual = claims.get("type")
        if actual != expected:
            raise TokenTypeMismatchError(
                f"Expected token type '{expected}', got '{actual}'"
            )

    return claims


def parse_token_payload(token: str, settings: Settings | None = None) -> TokenPayload:
    """Decode, verify, and parse token into a strongly typed TokenPayload model."""
    claims = verify_token(token, settings=settings)
    return TokenPayload.from_dict(claims)
