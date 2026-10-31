"""API Logger Ingestion Key Management Router."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.user.models.user import User
from tracura.auth.user_context import get_active_tenant_id, get_current_user
from tracura.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyRead
from tracura.services.api_key_service import ApiKeyService

router = APIRouter(prefix="/v1/keys", tags=["API logger - API Keys"])


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


@router.get("", response_model=list[ApiKeyRead], summary="List ingestion keys for tenant")
async def list_api_keys(
    project_id: uuid.UUID | None = Query(default=None, description="Filter by project UUID"),
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ApiKeyService = Depends(get_api_key_service),
) -> list[ApiKeyRead]:
    keys = await service.list_keys(session, tenant_id, project_id)
    result: list[ApiKeyRead] = []
    for k in keys:
        proj_name = k.project.name if k.project else None
        result.append(
            ApiKeyRead(
                id=k.id,
                tenant_id=k.tenant_id,
                name=k.name,
                key_prefix=k.key_prefix,
                status=k.status,
                project_id=k.project_id,
                project_name=proj_name,
                allowed_environments=k.allowed_environments or ["*"],
                ip_allowlist=k.ip_allowlist,
                allowed_origins=k.allowed_origins,
                rate_limit_rpm=k.rate_limit_rpm,
                expires_at=k.expires_at,
                last_used_at=k.last_used_at,
                created_at=k.created_at,
            )
        )
    return result


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED, summary="Generate new scoped ingestion key")
async def create_api_key(
    payload: ApiKeyCreate,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyCreatedResponse:
    """Generate a new scoped ingestion API key. The raw secret is returned ONCE in this response."""
    key_record, raw_key = await service.create_key(
        session=session,
        tenant_id=tenant_id,
        payload=payload,
        actor_id=current_user.id,
    )
    return ApiKeyCreatedResponse(
        id=key_record.id,
        name=key_record.name,
        key_prefix=key_record.key_prefix,
        raw_key=raw_key,
        project_id=key_record.project_id,
        allowed_environments=key_record.allowed_environments or ["*"],
        ip_allowlist=key_record.ip_allowlist,
        rate_limit_rpm=key_record.rate_limit_rpm,
        expires_at=key_record.expires_at,
        created_at=key_record.created_at,
    )


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an ingestion API key",
    responses={status.HTTP_404_NOT_FOUND: {"description": "API key not found"}},
)
async def revoke_api_key(
    key_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_active_tenant_id),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    service: ApiKeyService = Depends(get_api_key_service),
) -> None:
    success = await service.revoke_key(session, tenant_id, key_id, actor_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
