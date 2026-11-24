"""Audit endpoints (/audit): query the audit trail and record entries. Not mounted by the API server yet."""

from datetime import datetime
from typing import Any
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.models.audit_log import AuditLog
from kernel.audit.schemas.audit_log import (
    AuditLogCreate,
    AuditLogListResponse,
    AuditLogRead,
    AuditSummary,
)
from kernel.audit.services.audit_service import AuditService, audit_service
from kernel.audit.services.request_audit import actor_fields
from kernel.core.database import get_db
from kernel.core.services.errors import ServiceError

TAG = "Audit Trail"

router = APIRouter(prefix="/audit", tags=[TAG])

_bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token.",
)


def get_audit_service() -> AuditService:
    return audit_service


ANONYMOUS = {"actor_id": None, "actor_email": "anonymous@system.local", "actor_name": "Anonymous", "is_admin": False}
SYSTEM = {"actor_id": None, "actor_email": "system@innostes.local", "actor_name": "System Worker", "is_admin": False}


async def get_current_actor_info(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Who is calling: the signed-in user, "Anonymous" without a token, "System Worker" if the token is rejected."""
    if not credentials:
        return ANONYMOUS
    # Imported here because kernel.auth imports kernel.audit.
    from kernel.auth.dependencies import get_current_user

    try:
        user = await get_current_user(request=request, credentials=credentials, session=session)
    except ServiceError:
        return SYSTEM

    actor = actor_fields(user)
    if not actor["actor_name"] and actor["actor_email"]:
        actor["actor_name"] = actor["actor_email"].split("@")[0].capitalize()
    return {**actor, "is_admin": user.is_super_admin}


@router.get(
    "/logs",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Query audit trail logs",
    description="Search and filter immutable compliance and state-mutation audit logs.",
    operation_id="audit_list_logs",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing credentials"},
    },
)
async def list_audit_logs(
    action: str | None = Query(default=None, description="Filter by action type (e.g. CREATE, UPDATE, DELETE)."),
    entity_type: str | None = Query(default=None, description="Filter by entity type (e.g. user, role, employee)."),
    entity_id: str | None = Query(default=None, description="Filter by entity primary key or ID."),
    actor_id: uuid.UUID | None = Query(default=None, description="Filter by actor UUID."),
    search: str | None = Query(default=None, description="Search actor email, name, entity, reason, or IP."),
    date_from: datetime | None = Query(default=None, description="Filter events after UTC timestamp."),
    date_to: datetime | None = Query(default=None, description="Filter events before UTC timestamp."),
    status_code: str | None = Query(default=None, alias="status", description="Filter by outcome (SUCCESS, FAILED)."),
    correlation_id: str | None = Query(default=None, description="Filter by Tracura / request correlation ID."),
    limit: int = Query(default=50, ge=1, le=200, description="Page limit."),
    offset: int = Query(default=0, ge=0, description="Page offset."),
    x_tenant_id: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID", description="Optional tenant scope."),
    session: AsyncSession = Depends(get_db),
    service: AuditService = Depends(get_audit_service),
) -> AuditLogListResponse:
    """Query audit logs with dynamic filtering."""
    items, total = await service.query(
        session=session,
        tenant_id=x_tenant_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_id=actor_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
        status=status_code,
        correlation_id=correlation_id,
        limit=limit,
        offset=offset,
    )
    return AuditLogListResponse(
        items=[AuditLogRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=AuditSummary,
    status_code=status.HTTP_200_OK,
    summary="Get audit compliance summary KPIs",
    description="Returns aggregate counts of mutations, security events, top actors, and action breakdowns.",
    operation_id="audit_get_summary",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing credentials"},
    },
)
async def get_audit_summary(
    x_tenant_id: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID", description="Optional tenant scope."),
    session: AsyncSession = Depends(get_db),
    service: AuditService = Depends(get_audit_service),
) -> AuditSummary:
    """Retrieve high-level compliance summary statistics."""
    return await service.get_summary(session=session, tenant_id=x_tenant_id)


@router.get(
    "/entities/{entity_type}/{entity_id}",
    response_model=list[AuditLogRead],
    status_code=status.HTTP_200_OK,
    summary="Get entity change history",
    description="Returns the chronological sequence of mutations and actions performed on a specific record.",
    operation_id="audit_get_entity_history",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing credentials"},
    },
)
async def get_entity_history(
    entity_type: str = Path(description="Entity classification name.", examples=["user"]),
    entity_id: str = Path(description="Entity unique ID.", examples=["usr_90f234bc"]),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum historical entries."),
    x_tenant_id: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID", description="Optional tenant scope."),
    session: AsyncSession = Depends(get_db),
    service: AuditService = Depends(get_audit_service),
) -> list[AuditLogRead]:
    """Retrieve historical lifecycle timeline for a specific entity."""
    items = await service.get_entity_history(
        session=session,
        entity_type=entity_type,
        entity_id=entity_id,
        tenant_id=x_tenant_id,
        limit=limit,
    )
    return [AuditLogRead.model_validate(item) for item in items]


@router.get(
    "/logs/{log_id}",
    response_model=AuditLogRead,
    status_code=status.HTTP_200_OK,
    summary="Get single audit log entry",
    description="Retrieve full details and before/after field changes for a single audit record.",
    operation_id="audit_get_log",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing credentials"},
        status.HTTP_404_NOT_FOUND: {"description": "Audit log record not found"},
    },
)
async def get_audit_log(
    log_id: uuid.UUID = Path(description="Audit log UUID identifier."),
    x_tenant_id: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID", description="Optional tenant scope."),
    session: AsyncSession = Depends(get_db),
    service: AuditService = Depends(get_audit_service),
) -> AuditLogRead:
    """Fetch single audit log by ID."""
    record = await service.get_by_id(session=session, log_id=log_id, tenant_id=x_tenant_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log record not found.")
    return AuditLogRead.model_validate(record)


@router.post(
    "/logs",
    response_model=AuditLogRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record programmatic audit log entry",
    description="Manually record a domain action or compliance event.",
    operation_id="audit_create_log",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Invalid or missing credentials"},
        422: {"description": "Validation error"},
    },
)
async def create_audit_log(
    payload: AuditLogCreate,
    request: Request,
    actor_info: dict[str, Any] = Depends(get_current_actor_info),
    x_tenant_id: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID", description="Optional tenant scope."),
    session: AsyncSession = Depends(get_db),
    service: AuditService = Depends(get_audit_service),
) -> AuditLogRead:
    """Record an audit log entry. Fields left empty are filled from the request and the caller."""
    payload.tenant_id = payload.tenant_id or x_tenant_id
    payload.actor_id = payload.actor_id or actor_info["actor_id"]
    payload.actor_email = payload.actor_email or actor_info["actor_email"]
    payload.actor_name = payload.actor_name or actor_info["actor_name"]
    payload.ip_address = payload.ip_address or (request.client.host if request.client else None)
    payload.user_agent = payload.user_agent or request.headers.get("user-agent")
    payload.correlation_id = payload.correlation_id or request.headers.get("x-correlation-id")

    record = await service.record_from_schema(session=session, data=payload)
    await session.commit()
    return AuditLogRead.model_validate(record)
