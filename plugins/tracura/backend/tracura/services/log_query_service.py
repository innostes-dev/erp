"""API Logger Query & Inspection Service."""

from datetime import datetime
from typing import Any
import uuid
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from tracura.models.log import ApiLog
from tracura.schemas.log import LogListResponse, LogRead


class LogQueryService:
    """Provides high-performance filtering, full-text searching, and inspection of API logs."""

    async def get_log(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        log_id: uuid.UUID,
    ) -> ApiLog | None:
        """Fetch a single log entry by id, verifying tenant boundary."""
        stmt = select(ApiLog).where(
            ApiLog.id == log_id,
            ApiLog.tenant_id == tenant_id,
        )
        return (await session.execute(stmt)).scalar_one_or_none()

    async def query_logs(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID | None = None,
        environment_id: uuid.UUID | None = None,
        correlation_id: str | None = None,
        user_id: str | None = None,
        http_method: str | None = None,
        status_code: int | None = None,
        errors_only: bool = False,
        slow_requests_ms: float | None = None,
        search: str | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[ApiLog], int]:
        """Query telemetry logs with multi-attribute filtering and pagination."""
        base_filter = [ApiLog.tenant_id == tenant_id]

        if project_id:
            base_filter.append(ApiLog.project_id == project_id)
        if environment_id:
            base_filter.append(ApiLog.environment_id == environment_id)
        if correlation_id:
            base_filter.append(ApiLog.correlation_id == correlation_id)
        if user_id:
            base_filter.append(ApiLog.user_id == user_id)
        if http_method:
            base_filter.append(ApiLog.http_method == http_method.upper())
        if status_code:
            base_filter.append(ApiLog.status_code == status_code)
        if errors_only:
            base_filter.append(ApiLog.status_code >= 400)
        if slow_requests_ms is not None:
            base_filter.append(ApiLog.duration_ms >= slow_requests_ms)
        if start_time:
            base_filter.append(ApiLog.created_at >= start_time)
        if end_time:
            base_filter.append(ApiLog.created_at <= end_time)
        if search:
            search_pattern = f"%{search}%"
            base_filter.append(
                or_(
                    ApiLog.path.ilike(search_pattern),
                    ApiLog.url.ilike(search_pattern),
                    ApiLog.correlation_id.ilike(search_pattern),
                )
            )

        # Count total
        count_stmt = select(func.count(ApiLog.id)).where(*base_filter)
        total = (await session.execute(count_stmt)).scalar() or 0

        # Fetch page
        limit_clamped = min(max(1, limit), 200)
        data_stmt = (
            select(ApiLog)
            .where(*base_filter)
            .order_by(ApiLog.created_at.desc())
            .offset(offset)
            .limit(limit_clamped)
        )
        logs = list((await session.execute(data_stmt)).scalars().all())

        return logs, total
