"""FastAPI dependencies for identifying the current user."""

import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from kernel.core.security.jwt import decode_token

_bearer = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT access token. Optional for now; used to record who made a change.",
)


async def get_actor_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> uuid.UUID | None:
    """FastAPI dependency: id of the user making the request, or None.

    Reads the `Authorization: Bearer <token>` header and returns the token's
    `sub` claim as a UUID. Used to fill created_by / updated_by / deleted_by.

    It does NOT reject anonymous requests: a missing, invalid or expired
    token simply gives None. Endpoint protection comes with the identity
    feature.

    Args:
        credentials: Parsed bearer header, injected by FastAPI.

    Returns:
        The user's id, or None if there is no valid token.
    """
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return uuid.UUID(str(payload.get("sub")))
    except (jwt.PyJWTError, ValueError, TypeError):
        return None
