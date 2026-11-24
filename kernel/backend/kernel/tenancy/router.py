"""Tenant endpoints (/tenants): CRUD, the current tenant, and switching modules and plugins.

The docstring of each endpoint is its description in the API docs.
"""

from typing import Literal
import uuid

from fastapi import APIRouter, Depends, Header, Path, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.audit.services import actor_fields, audit_request
from kernel.core.database import get_db
from kernel.core.schemas import Page, error_responses
from kernel.core.security import get_actor_id
from kernel.core.services.errors import ForbiddenError, UnauthorizedError
from kernel.tenancy.catalog import module_catalog, plugin_catalog
from kernel.tenancy.models import Tenant, TenantMember, TenantMemberStatus, TenantModule, TenantPlugin
from kernel.tenancy.schemas import (
    ActivationResponse,
    ModuleListResponse,
    PluginListResponse,
    TenantCreate,
    TenantRead,
    TenantUpdate,
)
from kernel.tenancy.services import SlugTakenError, TenantNotFoundError, TenantService
from kernel.tenancy.services.features import active_features, run_plugin_hook, set_feature_active
from kernel.user.models.user import User

TAG = "Tenancy"
router = APIRouter(prefix="/tenants", tags=[TAG])
BEARER = {"security": [{"BearerAuth": []}]}

_bearer_scheme = HTTPBearer(
    auto_error=True,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token.",
)

TenantId = Path(
    description="Unique identifier of the tenant organisation.",
    examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
)


# ---- dependencies ------------------------------------------------------------


async def get_current_user_dep(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> User:
    # Imported here because kernel.auth.dependencies imports kernel.tenancy.
    from kernel.auth.dependencies import get_current_user

    return await get_current_user(request=request, credentials=credentials, session=session)


async def require_super_admin_dep(user: User = Depends(get_current_user_dep)) -> User:
    from kernel.auth.dependencies import require_super_admin

    return await require_super_admin(current_user=user)


def get_service(session: AsyncSession = Depends(get_db)) -> TenantService:
    return TenantService(session)


async def get_current_tenant_id(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> uuid.UUID:
    """Tenant for this request: the X-Tenant-ID header, else the user's first membership, else the oldest tenant."""
    if x_tenant_id:
        return x_tenant_id

    membership = select(TenantMember.tenant_id).where(
        TenantMember.user_id == user.id, TenantMember.status == TenantMemberStatus.ACTIVE
    )
    oldest = select(Tenant.id).where(Tenant.deleted_at.is_(None)).order_by(Tenant.created_at.asc())
    for stmt in (membership, oldest):
        tenant_id = (await session.execute(stmt.limit(1))).scalar_one_or_none()
        if tenant_id:
            return tenant_id
    raise TenantNotFoundError("No active tenant found for user.")


async def _get_or_404(service: TenantService, tenant_id: uuid.UUID, include_deleted: bool = False) -> Tenant:
    tenant = await service.get(tenant_id, include_deleted=include_deleted)
    if tenant is None:
        raise TenantNotFoundError()
    return tenant


# ---- tenants -------------------------------------------------------------------


@router.post(
    "",
    response_model=TenantRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tenant",
    response_description="The created tenant organisation.",
    operation_id="tenants_create",
    openapi_extra=BEARER,
    responses=error_responses(
        SlugTakenError,
        UnauthorizedError,
    ),
)
async def create_tenant(
    body: TenantCreate,
    request: Request,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Create a new tenant (customer organisation).

    Requires Bearer authentication. If a valid bearer token is sent, its user is
    recorded in `created_by` and `updated_by`. Returns **409** if the slug is already taken.
    """
    tenant = await service.create(body, actor_id)
    await audit_request(
        service.session, request, action="CREATE", entity_type="tenant", entity_id=str(tenant.id),
        entity_name=tenant.name, tenant_id=tenant.id, actor_id=actor_id,
        changes={"name": {"old": None, "new": tenant.name}, "slug": {"old": None, "new": tenant.slug}},
        reason=f"Created tenant organisation '{tenant.name}'",
    )
    return tenant


@router.get(
    "",
    response_model=Page[TenantRead],
    summary="List tenants",
    response_description="One page of tenants, newest first.",
    operation_id="tenants_list",
    openapi_extra=BEARER,
    responses=error_responses(UnauthorizedError),
)
async def list_tenants(
    offset: int = Query(0, ge=0, description="Number of tenants to skip.", examples=[0]),
    limit: int = Query(50, ge=1, le=200, description="Maximum tenants to return (1-200).", examples=[50]),
    include_deleted: bool = Query(False, description="Also return soft-deleted tenants.", examples=[False]),
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Page[TenantRead]:
    """List tenants with pagination, newest first.

    Requires Bearer authentication. Soft-deleted tenants are hidden unless
    `include_deleted=true` is requested.
    """
    items, total = await service.list(offset, limit, include_deleted)
    return Page[TenantRead](items=[TenantRead.model_validate(t) for t in items], total=total, offset=offset, limit=limit)


@router.get(
    "/current",
    response_model=TenantRead,
    summary="Get current tenant organisation details",
    operation_id="tenants_get_current",
    openapi_extra=BEARER,
    responses=error_responses(UnauthorizedError, TenantNotFoundError),
)
async def get_current_tenant(
    current_user: User = Depends(get_current_user_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    service: TenantService = Depends(get_service),
) -> TenantRead:
    """Return active tenant organisation details for the authenticated user/request."""
    return TenantRead.model_validate(await _get_or_404(service, tenant_id))


@router.get(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Get a tenant",
    response_description="The tenant organisation.",
    operation_id="tenants_get",
    openapi_extra=BEARER,
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
    ),
)
async def get_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Get one tenant organisation by unique id.

    Requires Bearer authentication. Soft-deleted tenants return 404.
    """
    return await _get_or_404(service, tenant_id)


@router.patch(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Update a tenant",
    response_description="The updated tenant organisation.",
    operation_id="tenants_update",
    openapi_extra=BEARER,
    responses=error_responses(
        TenantNotFoundError,
        SlugTakenError,
        UnauthorizedError,
    ),
)
async def update_tenant(
    body: TenantUpdate,
    request: Request,
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Change tenant organisation fields. Only sent fields are modified.

    Requires Bearer authentication. The calling user is recorded in `updated_by`.
    Soft-deleted tenants return 404; restore them first.
    """
    tenant = await _get_or_404(service, tenant_id)
    before = _audited_fields(tenant)
    updated = await service.update(tenant, body, actor_id)
    await audit_request(
        service.session, request, action="UPDATE", entity_type="tenant", entity_id=str(updated.id),
        entity_name=updated.name, tenant_id=updated.id, actor_id=actor_id,
        old_state=before, new_state=_audited_fields(updated),
        reason=f"Updated tenant organisation '{updated.name}'",
    )
    return updated


@router.delete(
    "/{tenant_id}",
    response_model=TenantRead,
    summary="Delete a tenant",
    response_description="The tenant organisation, now marked as deleted.",
    operation_id="tenants_delete",
    openapi_extra=BEARER,
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
    ),
)
async def delete_tenant(
    request: Request,
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Soft-delete a tenant organisation.

    Requires Bearer authentication. The tenant is hidden from standard lists
    but retained in the database. Sets `deleted_at` and `deleted_by`. Undo with
    `POST /tenants/{tenant_id}/restore`.
    """
    deleted = await service.soft_delete(await _get_or_404(service, tenant_id), actor_id)
    await audit_request(
        service.session, request, action="DELETE", entity_type="tenant", entity_id=str(deleted.id),
        entity_name=deleted.name, tenant_id=deleted.id, actor_id=actor_id,
        changes={"deleted": {"old": False, "new": True}},
        reason=f"Soft-deleted tenant organisation '{deleted.name}'",
    )
    return deleted


@router.post(
    "/{tenant_id}/restore",
    response_model=TenantRead,
    summary="Restore a deleted tenant",
    response_description="The tenant organisation, active again.",
    operation_id="tenants_restore",
    openapi_extra=BEARER,
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
    ),
)
async def restore_tenant(
    request: Request,
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Bring back a soft-deleted tenant organisation.

    Requires Bearer authentication. Clears `deleted_at` and `deleted_by`.
    Calling on an active tenant is harmless and idempotent.
    """
    restored = await service.restore(await _get_or_404(service, tenant_id, include_deleted=True), actor_id)
    await audit_request(
        service.session, request, action="RESTORE", entity_type="tenant", entity_id=str(restored.id),
        entity_name=restored.name, tenant_id=restored.id, actor_id=actor_id,
        changes={"deleted": {"old": True, "new": False}},
        reason=f"Restored tenant organisation '{restored.name}'",
    )
    return restored


def _audited_fields(tenant: Tenant) -> dict[str, str | None]:
    return {"name": tenant.name, "slug": tenant.slug, "country": tenant.country, "timezone": tenant.timezone}


# ---- modules and plugins -----------------------------------------------------------

ERRORS_FOR_SWITCH = error_responses(UnauthorizedError, ForbiddenError, TenantNotFoundError)


@router.get(
    "/current/modules",
    response_model=ModuleListResponse,
    summary="List business modules for current tenant",
    operation_id="tenants_list_modules",
    openapi_extra=BEARER,
    responses=error_responses(UnauthorizedError, TenantNotFoundError),
)
async def list_current_modules(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> ModuleListResponse:
    """Return catalog of business modules and their activation status.

    Requires Bearer authentication. Returns which packages are enabled for the
    current tenant organization context.
    """
    active = await active_features(session, TenantModule, tenant_id)
    return ModuleListResponse(installed=module_catalog(active), active_ids=list(active))


@router.post(
    "/current/modules/{module_id}/activate",
    response_model=ActivationResponse,
    summary="Activate a business module for tenant",
    operation_id="tenants_activate_module",
    openapi_extra=BEARER,
    responses=ERRORS_FOR_SWITCH,
)
async def activate_module(
    request: Request,
    module_id: str = Path(description="Package identifier of business module to activate.", examples=["peopleops"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> ActivationResponse:
    """Activate a business module for the current tenant.

    Requires Super Administrator privilege. Enables the module's feature set
    and navigation for the organization.
    """
    return await _switch(session, request, admin_user, tenant_id, "module", module_id, active=True)


@router.post(
    "/current/modules/{module_id}/deactivate",
    response_model=ActivationResponse,
    summary="Deactivate a business module for tenant",
    operation_id="tenants_deactivate_module",
    openapi_extra=BEARER,
    responses=ERRORS_FOR_SWITCH,
)
async def deactivate_module(
    request: Request,
    module_id: str = Path(description="Package identifier of business module to deactivate.", examples=["peopleops"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> ActivationResponse:
    """Deactivate a business module for the current tenant.

    Requires Super Administrator privilege. Disables access to module routes
    and navigation.
    """
    return await _switch(session, request, admin_user, tenant_id, "module", module_id, active=False)


@router.get(
    "/current/plugins",
    response_model=PluginListResponse,
    summary="List extensible plugins for current tenant",
    operation_id="tenants_list_plugins",
    openapi_extra=BEARER,
    responses=error_responses(UnauthorizedError, TenantNotFoundError),
)
async def list_current_plugins(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> PluginListResponse:
    """Return catalog of extensible plugins and their activation status.

    Requires Bearer authentication. Returns which plugins are enabled for the
    current tenant organisation context.
    """
    active = await active_features(session, TenantPlugin, tenant_id)
    return PluginListResponse(installed=plugin_catalog(active), active_ids=list(active))


@router.post(
    "/current/plugins/{plugin_id}/activate",
    response_model=ActivationResponse,
    summary="Activate an extensible plugin for tenant",
    operation_id="tenants_activate_plugin",
    openapi_extra=BEARER,
    responses=ERRORS_FOR_SWITCH,
)
async def activate_plugin(
    request: Request,
    plugin_id: str = Path(description="Package identifier of extensible plugin to activate.", examples=["tracura"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> ActivationResponse:
    """Activate an extensible plugin for the current tenant.

    Requires Super Administrator privilege. Enables third-party extensions
    and hook listeners for the organization.
    """
    return await _switch(session, request, admin_user, tenant_id, "plugin", plugin_id, active=True)


@router.post(
    "/current/plugins/{plugin_id}/deactivate",
    response_model=ActivationResponse,
    summary="Deactivate an extensible plugin for tenant",
    operation_id="tenants_deactivate_plugin",
    openapi_extra=BEARER,
    responses=ERRORS_FOR_SWITCH,
)
async def deactivate_plugin(
    request: Request,
    plugin_id: str = Path(description="Package identifier of extensible plugin to deactivate.", examples=["tracura"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
) -> ActivationResponse:
    """Deactivate an extensible plugin for the current tenant.

    Requires Super Administrator privilege. Disables third-party extensions
    and hook listeners.
    """
    return await _switch(session, request, admin_user, tenant_id, "plugin", plugin_id, active=False)


async def _switch(
    session: AsyncSession,
    request: Request,
    admin: User,
    tenant_id: uuid.UUID,
    kind: Literal["module", "plugin"],
    item_id: str,
    active: bool,
) -> ActivationResponse:
    """Turn a module or plugin on/off, tell the plugin, write the audit row and commit."""
    model = TenantModule if kind == "module" else TenantPlugin
    await set_feature_active(session, model, tenant_id, item_id, active, admin.id)
    if kind == "plugin":
        hook = "on_tenant_activate" if active else "on_tenant_deactivate"
        await run_plugin_hook(item_id, hook, session=session, tenant_id=tenant_id, actor_id=admin.id)

    label = kind.capitalize()
    await audit_request(
        session, request, action="RBAC_CHANGE", entity_type=f"tenant_{kind}", entity_id=item_id,
        entity_name=f"{label} {item_id}", tenant_id=tenant_id,
        changes={"is_active": {"old": not active, "new": active}},
        reason=f"{'Activated' if active else 'Deactivated'} {kind} '{item_id}'",
        **actor_fields(admin),
    )
    await session.commit()

    message = f"{label} '{item_id}' activated successfully." if active else f"{label} '{item_id}' deactivated."
    return ActivationResponse(item_id=item_id, is_active=active, message=message)
