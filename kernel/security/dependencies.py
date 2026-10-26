"""FastAPI Security Dependencies for Innostes ERP."""

from collections.abc import Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from kernel.security.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    TokenTypeMismatchError,
)
from kernel.security.jwt import verify_token
from kernel.security.schemas import TokenPayload, TokenType

bearer_scheme = HTTPBearer(auto_error=True)


def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Dependency that extracts and verifies an access JWT from the Authorization header."""
    token = credentials.credentials
    try:
        return verify_token(token, expected_type=TokenType.ACCESS)
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"The token has expired\""},
        )
    except TokenTypeMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )


def get_current_subject(
    payload: dict[str, Any] = Depends(get_token_payload),
) -> str:
    """Dependency that returns the authenticated subject (user identifier)."""
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject ('sub')",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(sub)


def get_current_token_payload_model(
    payload: dict[str, Any] = Depends(get_token_payload),
) -> TokenPayload:
    """Dependency that returns strongly typed TokenPayload model."""
    return TokenPayload.from_dict(payload)


def require_token_type(expected_type: str | TokenType) -> Callable[..., dict[str, Any]]:
    """Factory creating a dependency that enforces a specific token type."""

    def _dependency(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict[str, Any]:
        token = credentials.credentials
        try:
            return verify_token(token, expected_type=expected_type)
        except TokenExpiredError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except (TokenTypeMismatchError, InvalidTokenError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(exc),
                headers={"WWW-Authenticate": "Bearer"},
            )

    return _dependency
