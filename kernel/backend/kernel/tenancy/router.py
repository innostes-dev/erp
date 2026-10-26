"""Tenant HTTP endpoints, mounted at `/tenants`.

Each endpoint's docstring text before `\\f` is shown in the API docs
(`/docs`, `/redoc`); the part after `\\f` is for developers only.
"""

import uuid

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.core.schemas import Page, error_responses
from kernel.core.security import get_actor_id
from kernel.tenancy.models import Tenant
from kernel.tenancy.schemas import TenantCreate, TenantRead, TenantUpdate
from kernel.tenancy.services import SlugTakenError, TenantNotFoundError, TenantService

TAG = "Tenancy"

router = APIRouter(prefix="/tenants", tags=[TAG])

TenantId = Path(description="Id of the tenant.")


def get_service(session: AsyncSession = Depends(get_db)) -> TenantService:
    """FastAPI dependency that builds a `TenantService` for the request.

    Override it in tests with `app.dependency_overrides[get_service]`.

    Args:
        session: Request-scoped database session.

    Returns:
        A service bound to that session.
    """
    return TenantService(session)


async def _get_or_404(
    service: TenantService, tenant_id: uuid.UUID, include_deleted: bool = False
) -> Tenant:
    """Load a tenant or stop the request with `TenantNotFoundError` (404).

    Args:
        service: Tenant service.
        tenant_id: Id to look up.
        include_deleted: If True, a soft-deleted tenant is also found.

    Returns:
        The tenant.

    Raises:
        TenantNotFoundError: The tenant does not exist.
    """
    tenant = await service.get(tenant_id, include_deleted=include_deleted)
    if tenant is None:
        raise TenantNotFoundError()
    return tenant


@router.post(
    "",
    response_model=TenantRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tenant",
    response_description="The created tenant.",
    responses=error_responses(SlugTakenError),
    operation_id="tenants_create",
)
async def create_tenant(
    body: TenantCreate,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Create a new tenant (customer organisation).

    If a valid bearer token is sent, its user is recorded in `created_by`
    and `updated_by`. Returns **409** if the slug is already used.
    \f
    Args:
        body: Tenant fields.
        service: Injected tenant service.
        actor_id: Injected id of the calling user, or None.

    Returns:
        The new tenant.

    Raises:
        SlugTakenError: The slug is taken (409).
    """
    return await service.create(body, actor_id)


@router.get(
    "",
    response_model=Page[TenantRead],
    summary="List tenants",
    response_description="One page of tenants, newest first.",
    operation_id="tenants_list",
)
async def list_tenants(
    offset: int = Query(0, ge=0, description="Number of tenants to skip."),
    limit: int = Query(50, ge=1, le=200, description="Maximum tenants to return (1-200)."),
    include_deleted: bool = Query(False, description="Also return soft-deleted tenants."),
    service: TenantService = Depends(get_service),
) -> Page[TenantRead]:
    """List tenants with pagination, newest first.

    Soft-deleted tenants are hidden unless `include_deleted=true`.
    \f
    Args:
        offset: Number of tenants to skip.
        limit: Page size.
        include_deleted: Whether to include soft-deleted tenants.
        service: Injected tenant service.

    Returns:
        A page of tenants plus the total count.
    """
    items, total = await service.list(offset, limit, include_deleted)
    return Page[TenantRead](
        items=[TenantRead.model_validate(t) for t in items],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Get a tenant",
    response_description="The tenant.",
    responses=error_responses(TenantNotFoundError),
    operation_id="tenants_get",
)
async def get_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
) -> Tenant:
    """Get one tenant by id. Soft-deleted tenants return 404.
    \f
    Args:
        tenant_id: Tenant id from the URL.
        service: Injected tenant service.

    Returns:
        The tenant.

    Raises:
        TenantNotFoundError: Not found (404).
    """
    return await _get_or_404(service, tenant_id)


@router.patch(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Update a tenant",
    response_description="The updated tenant.",
    responses=error_responses(TenantNotFoundError, SlugTakenError),
    operation_id="tenants_update",
)
async def update_tenant(
    body: TenantUpdate,
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Change a tenant. Only the fields you send are updated.

    The calling user (from the bearer token) is recorded in `updated_by`.
    Soft-deleted tenants return 404; restore them first.
    \f
    Args:
        body: Fields to change.
        tenant_id: Tenant id from the URL.
        service: Injected tenant service.
        actor_id: Injected id of the calling user, or None.

    Returns:
        The updated tenant.

    Raises:
        TenantNotFoundError: Not found (404).
        SlugTakenError: The slug is taken (409).
    """
    tenant = await _get_or_404(service, tenant_id)
    return await service.update(tenant, body, actor_id)


@router.delete(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Delete a tenant (soft delete)",
    response_description="The tenant, now marked as deleted.",
    responses=error_responses(TenantNotFoundError),
    operation_id="tenants_delete",
)
async def delete_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Soft-delete a tenant: it is hidden from lists but kept in the database.

    Sets `deleted_at` and `deleted_by`. Undo with
    `POST /tenants/{tenant_id}/restore`.
    \f
    Args:
        tenant_id: Tenant id from the URL.
        service: Injected tenant service.
        actor_id: Injected id of the calling user, or None.

    Returns:
        The deleted tenant.

    Raises:
        TenantNotFoundError: Not found or already deleted (404).
    """
    tenant = await _get_or_404(service, tenant_id)
    return await service.soft_delete(tenant, actor_id)


@router.post(
    "/{tenant_id}/restore",
    response_model=TenantRead,
    summary="Restore a deleted tenant",
    response_description="The tenant, active again.",
    responses=error_responses(TenantNotFoundError),
    operation_id="tenants_restore",
)
async def restore_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Bring back a soft-deleted tenant.

    Clears `deleted_at` and `deleted_by`. Calling it on an active tenant
    is harmless.
    \f
    Args:
        tenant_id: Tenant id from the URL.
        service: Injected tenant service.
        actor_id: Injected id of the calling user, or None.

    Returns:
        The restored tenant.

    Raises:
        TenantNotFoundError: The tenant never existed (404).
    """
    tenant = await _get_or_404(service, tenant_id, include_deleted=True)
    return await service.restore(tenant, actor_id)
