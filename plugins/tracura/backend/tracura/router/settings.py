"""API Logger Settings & Scrubbing Policies Router."""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.user.models.user import User
from tracura.auth.user_context import get_active_tenant_id, get_current_user
from tracura.schemas.settings import SettingsRead, SettingsUpdate
from tracura.services.settings_service import SettingsService

router = APIRouter(prefix="/v1/settings", tags=["API logger - Settings"])


def get_settings_service() -> SettingsService:
    return SettingsService()


@router.get("", response_model=SettingsRead, summary="Get effective settings and policies")
async def get_settings(
    project_id: uuid.UUID | None = Query(default=None, description="Project scope override"),
    environment_id: uuid.UUID | None = Query(default=None, description="Environment scope override"),
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsRead:
    settings = await service.get_effective_settings(
        session=session,
        tenant_id=tenant_id,
        project_id=project_id,
        environment_id=environment_id,
    )
    return SettingsRead.model_validate(settings)


@router.patch("", response_model=SettingsRead, summary="Update retention, sampling, or scrubbing settings")
async def update_settings(
    payload: SettingsUpdate,
    project_id: uuid.UUID | None = Query(default=None, description="Project scope override"),
    environment_id: uuid.UUID | None = Query(default=None, description="Environment scope override"),
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: SettingsService = Depends(get_settings_service),
) -> SettingsRead:
    settings = await service.update_settings(
        session=session,
        tenant_id=tenant_id,
        payload=payload,
        project_id=project_id,
        environment_id=environment_id,
        actor_id=current_user.id,
    )
    return SettingsRead.model_validate(settings)
