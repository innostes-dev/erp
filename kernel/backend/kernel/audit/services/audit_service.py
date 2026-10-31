"""Audit subsystem service logic for recording and querying immutable compliance events."""

from datetime import datetime
from typing import Any
import uuid

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.models.audit_log import AuditLog
from kernel.audit.schemas.audit_log import (
    ActionCount,
    ActorSummary,
    AuditLogCreate,
    AuditSummary,
    EntityActivity,
)

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


def compute_field_diff(
    old_state: dict[str, Any] | None,
    new_state: dict[str, Any] | None,
    exclude_keys: set[str] | None = None,
) -> dict[str, dict[str, Any]]:
    """Compute field-level changes between old and new state dictionaries.

    Masks sensitive values such as passwords, tokens, and hashes.
    """
    if old_state is None and new_state is None:
        return {}

    old = old_state or {}
    new = new_state or {}
    exclude = SENSITIVE_KEYS.union(exclude_keys or set())

    all_keys = set(old.keys()).union(set(new.keys()))
    diff: dict[str, dict[str, Any]] = {}

    for k in sorted(all_keys):
        if k in exclude:
            continue
        old_val = old.get(k)
        new_val = new.get(k)
        if old_val != new_val:
            diff[k] = {"old": old_val, "new": new_val}

    return diff


class AuditService:
    """Service handling audit event recording, queries, entity timelines, and KPI aggregations."""

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
        """Record an immutable audit log entry."""
        computed_changes = changes or {}
        if not computed_changes and (old_state is not None or new_state is not None):
            computed_changes = compute_field_diff(old_state, new_state)

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
            changes=computed_changes,
            ip_address=ip_address,
            user_agent=user_agent,
            correlation_id=correlation_id,
            reason=reason,
            status=status.upper(),
        )
        session.add(record)
        await session.flush()
        return record

    async def record_from_schema(
        self,
        session: AsyncSession,
        data: AuditLogCreate,
    ) -> AuditLog:
        """Record an audit log from a validated Pydantic schema."""
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
        """Query audit logs with dynamic filtering and count."""
        stmt = select(AuditLog)

        if tenant_id:
            stmt = stmt.where(AuditLog.tenant_id == tenant_id)
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type.lower())
        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == entity_id)
        if action:
            stmt = stmt.where(AuditLog.action == action.upper())
        if actor_id:
            stmt = stmt.where(AuditLog.actor_id == actor_id)
        if status:
            stmt = stmt.where(AuditLog.status == status.upper())
        if correlation_id:
            stmt = stmt.where(AuditLog.correlation_id == correlation_id)
        if date_from:
            stmt = stmt.where(AuditLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(AuditLog.created_at <= date_to)
        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    AuditLog.actor_email.ilike(term),
                    AuditLog.actor_name.ilike(term),
                    AuditLog.entity_name.ilike(term),
                    AuditLog.entity_id.ilike(term),
                    AuditLog.reason.ilike(term),
                    AuditLog.ip_address.ilike(term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await session.execute(count_stmt)
        total = total_res.scalar_one() or 0

        # Fetch items
        fetch_stmt = stmt.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit)
        items_res = await session.execute(fetch_stmt)
        items = list(items_res.scalars().all())

        return items, total

    async def get_by_id(
        self,
        session: AsyncSession,
        log_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
    ) -> AuditLog | None:
        """Fetch a single audit log entry by ID."""
        stmt = select(AuditLog).where(AuditLog.id == log_id)
        if tenant_id:
            stmt = stmt.where(AuditLog.tenant_id == tenant_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_entity_history(
        self,
        session: AsyncSession,
        entity_type: str,
        entity_id: str,
        tenant_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[AuditLog]:
        """Fetch the chronological change history for a specific entity."""
        stmt = (
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type.lower(),
                AuditLog.entity_id == str(entity_id),
            )
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
        )
        if tenant_id:
            stmt = stmt.where(AuditLog.tenant_id == tenant_id)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_summary(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID | None = None,
    ) -> AuditSummary:
        """Calculate high-level compliance KPIs and breakdown metrics."""
        base_filter = []
        if tenant_id:
            base_filter.append(AuditLog.tenant_id == tenant_id)

        # Total events
        total_stmt = select(func.count(AuditLog.id))
        if base_filter:
            total_stmt = total_stmt.where(*base_filter)
        total = (await session.execute(total_stmt)).scalar_one() or 0

        # Mutations count
        mutations_stmt = select(func.count(AuditLog.id)).where(
            AuditLog.action.in_(["CREATE", "UPDATE", "DELETE", "RESTORE"]),
            *base_filter,
        )
        mutations = (await session.execute(mutations_stmt)).scalar_one() or 0

        # Security count
        security_stmt = select(func.count(AuditLog.id)).where(
            AuditLog.action.in_(["LOGIN", "LOGOUT", "PASSWORD_RESET", "RBAC_CHANGE"]),
            *base_filter,
        )
        security = (await session.execute(security_stmt)).scalar_one() or 0

        # Unique actors
        actors_count_stmt = select(func.count(func.distinct(AuditLog.actor_email)))
        if base_filter:
            actors_count_stmt = actors_count_stmt.where(*base_filter)
        unique_actors = (await session.execute(actors_count_stmt)).scalar_one() or 0

        # Action breakdown
        actions_stmt = (
            select(AuditLog.action, func.count(AuditLog.id))
            .where(*base_filter)
            .group_by(AuditLog.action)
            .order_by(desc(func.count(AuditLog.id)))
            .limit(10)
        )
        actions_res = (await session.execute(actions_stmt)).all()
        actions_breakdown = [ActionCount(action=row[0], count=row[1]) for row in actions_res]

        # Entity breakdown
        entity_stmt = (
            select(AuditLog.entity_type, func.count(AuditLog.id))
            .where(*base_filter)
            .group_by(AuditLog.entity_type)
            .order_by(desc(func.count(AuditLog.id)))
            .limit(10)
        )
        entity_res = (await session.execute(entity_stmt)).all()
        entity_breakdown = [EntityActivity(entity_type=row[0], count=row[1]) for row in entity_res]

        # Top actors
        top_actors_stmt = (
            select(
                AuditLog.actor_id,
                AuditLog.actor_email,
                AuditLog.actor_name,
                func.count(AuditLog.id),
            )
            .where(AuditLog.actor_email.isnot(None), *base_filter)
            .group_by(AuditLog.actor_id, AuditLog.actor_email, AuditLog.actor_name)
            .order_by(desc(func.count(AuditLog.id)))
            .limit(5)
        )
        top_res = (await session.execute(top_actors_stmt)).all()
        top_actors = [
            ActorSummary(
                actor_id=str(row[0]) if row[0] else None,
                actor_email=row[1] or "Unknown",
                actor_name=row[2] or (row[1] or "Unknown").split("@")[0].capitalize(),
                count=row[3],
            )
            for row in top_res
        ]

        return AuditSummary(
            total_events=total,
            mutations_count=mutations,
            security_count=security,
            unique_actors_count=unique_actors,
            actions_breakdown=actions_breakdown,
            entity_breakdown=entity_breakdown,
            top_actors=top_actors,
        )


audit_service = AuditService()
