"""Audit subsystem schemas for requests, responses, diff inspection, and analytics."""

from datetime import datetime
from enum import Enum
from typing import Any
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AuditAction(str, Enum):
    """Enumeration of standardized audit actions."""

    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    RESTORE = "RESTORE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PASSWORD_RESET = "PASSWORD_RESET"
    RBAC_CHANGE = "RBAC_CHANGE"
    EXPORT = "EXPORT"
    SYSTEM_ACTION = "SYSTEM_ACTION"


class AuditLogBase(BaseModel):
    """Base fields for an audit log."""

    action: str = Field(description="Action classification (e.g. CREATE, UPDATE, DELETE, LOGIN, RBAC_CHANGE).", examples=["UPDATE"])
    entity_type: str = Field(description="Target entity type (e.g. user, role, employee, deal).", examples=["user"])
    entity_id: str = Field(description="Unique identifier of the entity.", examples=["usr_90f234bc"])
    entity_name: str | None = Field(default=None, description="Human-readable label for the entity.", examples=["Jane Doe"])
    changes: dict[str, Any] = Field(
        default_factory=dict,
        description="Field-by-field before and after values: {'fieldName': {'old': val1, 'new': val2}}.",
        examples=[{"salary": {"old": 80000, "new": 95000}}],
    )
    ip_address: str | None = Field(default=None, description="Client IPv4 or IPv6 address.", examples=["192.168.1.1"])
    user_agent: str | None = Field(default=None, description="Client user-agent string.", examples=["Mozilla/5.0"])
    correlation_id: str | None = Field(default=None, description="Request trace ID linking to Tracura telemetry.", examples=["req_99b1a03f"])
    reason: str | None = Field(default=None, description="Optional business reason or ticket justification.", examples=["Annual performance compensation revision"])
    status: str = Field(default="SUCCESS", description="Outcome of the action: SUCCESS or FAILED.", examples=["SUCCESS"])


class AuditLogCreate(AuditLogBase):
    """Schema for recording a new audit log event."""

    tenant_id: uuid.UUID | None = Field(default=None, description="Target tenant UUID.")
    actor_id: uuid.UUID | None = Field(default=None, description="User UUID performing the action.")
    actor_email: str | None = Field(default=None, description="Snapshot email of actor.")
    actor_name: str | None = Field(default=None, description="Snapshot name of actor.")


class AuditLogRead(AuditLogBase):
    """Schema for reading a complete audit log record."""

    id: uuid.UUID = Field(description="Audit log record primary key.")
    tenant_id: uuid.UUID | None = Field(default=None, description="Tenant organization UUID.")
    actor_id: uuid.UUID | None = Field(default=None, description="Actor user UUID.")
    actor_email: str | None = Field(default=None, description="Actor email snapshot.")
    actor_name: str | None = Field(default=None, description="Actor full name snapshot.")
    created_at: datetime = Field(description="Immutable UTC timestamp when the event occurred.")

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Paginated response containing audit log records."""

    items: list[AuditLogRead] = Field(description="List of audit log items matching the query.")
    total: int = Field(description="Total number of items matching filter criteria.")
    limit: int = Field(description="Maximum items returned per page.")
    offset: int = Field(description="Offset count.")


class ActorSummary(BaseModel):
    """Aggregate stats for a frequent actor."""

    actor_id: str | None = Field(description="Actor ID or SYSTEM.")
    actor_email: str = Field(description="Actor email or identifier.")
    actor_name: str = Field(description="Actor name.")
    count: int = Field(description="Number of actions recorded.")


class ActionCount(BaseModel):
    """Action breakdown counter."""

    action: str = Field(description="Action name.")
    count: int = Field(description="Occurrences count.")


class EntityActivity(BaseModel):
    """Activity counts by entity type."""

    entity_type: str = Field(description="Entity name.")
    count: int = Field(description="Occurrences count.")


class AuditSummary(BaseModel):
    """High-level summary metrics for audit compliance dashboard."""

    total_events: int = Field(description="Total recorded audit logs.")
    mutations_count: int = Field(description="Total state changing events (CREATE, UPDATE, DELETE).")
    security_count: int = Field(description="Total security and access events (LOGIN, LOGOUT, PASSWORD_RESET, RBAC_CHANGE).")
    unique_actors_count: int = Field(description="Number of distinct actors.")
    actions_breakdown: list[ActionCount] = Field(description="Events grouped by action type.")
    entity_breakdown: list[EntityActivity] = Field(description="Events grouped by entity type.")
    top_actors: list[ActorSummary] = Field(description="Most active actors.")
