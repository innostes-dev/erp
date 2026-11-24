"""Write audit rows from HTTP handlers."""

import logging
from typing import Any
import uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.services.audit_service import audit_service
from kernel.core.crypto import FieldCipher
from kernel.core.http import client_ip

logger = logging.getLogger(__name__)


def full_name(first_name: str | None, last_name: str | None) -> str:
    return " ".join(part for part in (first_name, last_name) if part)


def actor_fields(user: Any) -> dict[str, Any]:
    """`actor_id`, `actor_email` and `actor_name` for the user making the request.

    Works with the `User` row (email is encrypted) and with `UserRead` (email in plain text).
    """
    email = getattr(user, "email", None)
    if not isinstance(email, str):
        email = _decrypt(getattr(user, "email_encrypted", None))
    name = full_name(getattr(user, "first_name", None), getattr(user, "last_name", None))
    return {"actor_id": user.id, "actor_email": email, "actor_name": name or email}


def _decrypt(ciphertext: Any) -> str | None:
    if not isinstance(ciphertext, str):
        return None
    try:
        return FieldCipher().decrypt(ciphertext)
    except Exception:
        return None


async def audit_request(
    session: AsyncSession,
    request: Request,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    entity_name: str | None = None,
    reason: str | None = None,
    tenant_id: uuid.UUID | None = None,
    changes: dict[str, Any] | None = None,
    old_state: dict[str, Any] | None = None,
    new_state: dict[str, Any] | None = None,
    actor_id: uuid.UUID | None = None,
    actor_email: str | None = None,
    actor_name: str | None = None,
) -> None:
    """Record a successful action with the request's IP, user agent and correlation id.

    Auditing must never fail the request, so errors are logged instead of raised.
    """
    try:
        await audit_service.record(
            session=session,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            changes=changes,
            old_state=old_state,
            new_state=new_state,
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            actor_name=actor_name,
            ip_address=client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            correlation_id=request.headers.get("x-correlation-id") or getattr(request.state, "correlation_id", None),
            reason=reason,
            status="SUCCESS",
        )
    except Exception:
        logger.exception("Could not write audit row: %s %s %s", action, entity_type, entity_id)
