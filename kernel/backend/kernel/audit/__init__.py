"""Audit feature: enterprise immutable audit trail, entity change tracking, and compliance logs."""

from kernel.audit.models import AuditLog
from kernel.audit.router import TAG, router
from kernel.audit.schemas import (
    ActionCount,
    ActorSummary,
    AuditAction,
    AuditLogBase,
    AuditLogCreate,
    AuditLogListResponse,
    AuditLogRead,
    AuditSummary,
    EntityActivity,
)
from kernel.audit.services import (
    AuditService,
    audit_service,
    compute_field_diff,
)
from kernel.core.module import BaseModule


class AuditModule(BaseModule):
    """Kernel audit trail module plugging compliance query endpoints into the API server."""

    name = "audit"
    version = "0.1.0"
    description = "Enterprise immutable audit trail and compliance logging"
    router = router
    openapi_tags = [
        {
            "name": TAG,
            "description": (
                "Audit trail provides non-repudiation and regulatory compliance tracking. "
                "Every business state mutation, authentication action, and RBAC change is "
                "recorded in an immutable append-only ledger with field-level before/after diffs."
            ),
        }
    ]


module = AuditModule()
"""Ready-made instance picked up by ModuleLoader."""

__all__ = [
    "ActionCount",
    "ActorSummary",
    "AuditAction",
    "AuditLog",
    "AuditLogBase",
    "AuditLogCreate",
    "AuditLogListResponse",
    "AuditLogRead",
    "AuditModule",
    "AuditService",
    "AuditSummary",
    "EntityActivity",
    "audit_service",
    "compute_field_diff",
    "module",
    "router",
]
