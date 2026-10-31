"""API Logger Logs Explorer & Inspection Router."""

from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.user.models.user import User
from tracura.auth.user_context import get_active_tenant_id, get_current_user
from tracura.schemas.log import LogListResponse, LogRead
from tracura.services.log_query_service import LogQueryService

router = APIRouter(prefix="/v1/logs", tags=["API logger - Explorer"])


def get_log_query_service() -> LogQueryService:
    return LogQueryService()


@router.get("", response_model=LogListResponse, summary="Query telemetry logs with multi-attribute filtering")
async def query_logs(
    project_id: uuid.UUID | None = Query(default=None, description="Filter by project UUID"),
    environment_id: uuid.UUID | None = Query(default=None, description="Filter by environment UUID"),
    correlation_id: str | None = Query(default=None, description="Filter by trace/correlation ID"),
    user_id: str | None = Query(default=None, description="Filter by user ID"),
    http_method: str | None = Query(default=None, description="Filter by HTTP method (GET, POST, etc.)"),
    status_code: int | None = Query(default=None, description="Filter by exact HTTP status code"),
    errors_only: bool = Query(default=False, description="Filter error responses only (status >= 400)"),
    slow_requests_ms: float | None = Query(default=None, description="Filter slow requests exceeding latency ms"),
    search: str | None = Query(default=None, description="Substring search in URL, path, or trace ID"),
    start_time: datetime | None = Query(default=None, description="Start time UTC"),
    end_time: datetime | None = Query(default=None, description="End time UTC"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    limit: int = Query(default=50, ge=1, le=200, description="Page limit"),
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: LogQueryService = Depends(get_log_query_service),
) -> LogListResponse:
    logs, total = await service.query_logs(
        session=session,
        tenant_id=tenant_id,
        project_id=project_id,
        environment_id=environment_id,
        correlation_id=correlation_id,
        user_id=user_id,
        http_method=http_method,
        status_code=status_code,
        errors_only=errors_only,
        slow_requests_ms=slow_requests_ms,
        search=search,
        start_time=start_time,
        end_time=end_time,
        offset=offset,
        limit=limit,
    )
    return LogListResponse(
        items=[LogRead.model_validate(log) for log in logs],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{log_id}", response_model=LogRead, summary="Get single log entry details for Inspector drawer")
async def get_log(
    log_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: LogQueryService = Depends(get_log_query_service),
) -> LogRead:
    log = await service.get_log(session, tenant_id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")
    return LogRead.model_validate(log)
