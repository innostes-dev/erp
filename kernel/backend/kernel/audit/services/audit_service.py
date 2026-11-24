"""Write audit rows and query them (list, entity history, summary)."""

from datetime import datetime
from typing import Any
import uuid

from sqlalchemy import ColumnElement, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.models.audit_log import AuditLog
from kernel.audit.schemas.audit_log import (
    ActionCount,
    ActorSummary,
    AuditLogCreate,
    AuditSummary,
    EntityActivity,
)

# Never written to the `changes` column, even if they changed.
SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "secret",
    "client_secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "key_hash",
}
MUTATION_ACTIONS = ["CREATE", "UPDATE", "DELETE", "RESTORE"]
SECURITY_ACTIONS = ["LOGIN", "LOGOUT", "PASSWORD_RESET", "RBAC_CHANGE"]


def compute_field_diff(
    old_state: dict[str, Any] | None,
    new_state: dict[str, Any] | None,
    exclude_keys: set[str] | None = None,
) -> dict[str, dict[str, Any]]:
    """`{field: {"old": ..., "new": ...}}` for fields that changed, without sensitive ones."""
    if old_state is None and new_state is None:
        return {}
    old, new = old_state or {}, new_state or {}
    skip = SENSITIVE_KEYS | (exclude_keys or set())
    return {
        key: {"old": old.get(key), "new": new.get(key)}
        for key in sorted(old.keys() | new.keys())
        if key not in skip and old.get(key) != new.get(key)
    }


class AuditService:
    async def record(
        self,
        session: AsyncSession,
        action: str,
        entity_type: str,
        entity_id: str,
        entity_name: str | None = None,
        changes: dict[str, Any] | None = None,
        old_state: dict[str, Any] | None = None,
        new_state: dict[str, Any] | None = None,
        tenant_id: uuid.UUID | None = None,
        actor_id: uuid.UUID | None = None,
        actor_email: str | None = None,
        actor_name: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        correlation_id: str | None = None,
        reason: str | None = None,
        status: str = "SUCCESS",
    ) -> AuditLog:
        """Add an audit row. `changes` is computed from old/new state when not given."""
        if not changes and (old_state is not None or new_state is not None):
            changes = compute_field_diff(old_state, new_state)

        record = AuditLog(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            actor_name=actor_name,
            action=action.upper(),
            entity_type=entity_type.lower(),
            entity_id=str(entity_id),
            entity_name=entity_name,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
            reason=reason,
            status=status.upper(),
        )
        session.add(record)
        await session.flush()
        return record

    async def record_from_schema(self, session: AsyncSession, data: AuditLogCreate) -> AuditLog:
        return await self.record(
            session=session,
            action=data.action,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            entity_name=data.entity_name,
            changes=data.changes,
            tenant_id=data.tenant_id,
            actor_id=data.actor_id,
            actor_email=data.actor_email,
            actor_name=data.actor_name,
            ip_address=data.ip_address,
            user_agent=data.user_agent,
            correlation_id=data.correlation_id,
            reason=data.reason,
            status=data.status,
        )

    # ---- queries ---------------------------------------------------------

    async def query(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        action: str | None = None,
        actor_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        status: str | None = None,
        correlation_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        """One page of matching rows (newest first) and the total count. Empty filters are ignored."""
        filters = _in_tenant(tenant_id)
        if entity_type:
            filters.append(AuditLog.entity_type == entity_type.lower())
        if entity_id:
            filters.append(AuditLog.entity_id == entity_id)
        if action:
            filters.append(AuditLog.action == action.upper())
        if actor_id:
            filters.append(AuditLog.actor_id == actor_id)
        if status:
            filters.append(AuditLog.status == status.upper())
        if correlation_id:
            filters.append(AuditLog.correlation_id == correlation_id)
        if date_from:
            filters.append(AuditLog.created_at >= date_from)
        if date_to:
            filters.append(AuditLog.created_at <= date_to)
        if search:
            filters.append(_matches(search))
        stmt = select(AuditLog).where(*filters)

        total = (await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
        page = stmt.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit)
        return list((await session.execute(page)).scalars().all()), total

    async def get_by_id(
        self, session: AsyncSession, log_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> AuditLog | None:
        stmt = select(AuditLog).where(AuditLog.id == log_id, *_in_tenant(tenant_id))
        return (await session.execute(stmt)).scalar_one_or_none()

    async def get_entity_history(
        self,
        session: AsyncSession,
        entity_type: str,
        entity_id: str,
        tenant_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[AuditLog]:
        """Rows about one record, newest first."""
        stmt = (
            select(AuditLog)
            .where(AuditLog.entity_type == entity_type.lower(), AuditLog.entity_id == str(entity_id), *_in_tenant(tenant_id))
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
        )
        return list((await session.execute(stmt)).scalars().all())

    async def get_summary(self, session: AsyncSession, tenant_id: uuid.UUID | None = None) -> AuditSummary:
        """Counts for the audit dashboard."""
        scope = _in_tenant(tenant_id)

        async def count(*conditions: ColumnElement[bool]) -> int:
            return (await session.execute(select(func.count(AuditLog.id)).where(*scope, *conditions))).scalar_one() or 0

        async def top(column: Any, limit: int) -> list[Any]:
            stmt = (
                select(column, func.count(AuditLog.id))
                .where(*scope)
                .group_by(column)
                .order_by(desc(func.count(AuditLog.id)))
                .limit(limit)
            )
            return (await session.execute(stmt)).all()

        unique_actors = select(func.count(func.distinct(AuditLog.actor_email))).where(*scope)
        top_actors = (
            select(AuditLog.actor_id, AuditLog.actor_email, AuditLog.actor_name, func.count(AuditLog.id))
            .where(AuditLog.actor_email.isnot(None), *scope)
            .group_by(AuditLog.actor_id, AuditLog.actor_email, AuditLog.actor_name)
            .order_by(desc(func.count(AuditLog.id)))
            .limit(5)
        )

        return AuditSummary(
            total_events=await count(),
            mutations_count=await count(AuditLog.action.in_(MUTATION_ACTIONS)),
            security_count=await count(AuditLog.action.in_(SECURITY_ACTIONS)),
            unique_actors_count=(await session.execute(unique_actors)).scalar_one() or 0,
            actions_breakdown=[ActionCount(action=a, count=n) for a, n in await top(AuditLog.action, 10)],
            entity_breakdown=[EntityActivity(entity_type=e, count=n) for e, n in await top(AuditLog.entity_type, 10)],
            top_actors=[
                ActorSummary(
                    actor_id=str(actor_id) if actor_id else None,
                    actor_email=email or "Unknown",
                    actor_name=name or (email or "Unknown").split("@")[0].capitalize(),
                    count=n,
                )
                for actor_id, email, name, n in (await session.execute(top_actors)).all()
            ],
        )


def _in_tenant(tenant_id: uuid.UUID | None) -> list[ColumnElement[bool]]:
    return [AuditLog.tenant_id == tenant_id] if tenant_id else []


def _matches(search: str) -> ColumnElement[bool]:
    term = f"%{search.strip()}%"
    return or_(
        AuditLog.actor_email.ilike(term),
        AuditLog.actor_name.ilike(term),
        AuditLog.entity_name.ilike(term),
        AuditLog.entity_id.ilike(term),
        AuditLog.reason.ilike(term),
        AuditLog.ip_address.ilike(term),
    )


audit_service = AuditService()
