"""API Logger Telemetry Analytics & Metrics Router."""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.user.models.user import User
from tracura.auth.user_context import get_active_tenant_id, get_current_user
from tracura.schemas.analytics import AnalyticsDashboard
from tracura.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/v1/analytics", tags=["API logger - Analytics"])


def get_analytics_service() -> AnalyticsService:
    return AnalyticsService()


@router.get("/dashboard", response_model=AnalyticsDashboard, summary="Get high-level KPIs and timeseries metrics")
async def get_dashboard_metrics(
    project_id: uuid.UUID | None = Query(default=None, description="Project scope"),
    environment_id: uuid.UUID | None = Query(default=None, description="Environment scope"),
    lookback_hours: int = Query(default=24, ge=1, le=720, description="Lookback window in hours"),
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsDashboard:
    return await service.get_dashboard(
        session=session,
        tenant_id=tenant_id,
        project_id=project_id,
        environment_id=environment_id,
        lookback_hours=lookback_hours,
    )
