"""Tenant HTTP endpoints, mounted at `/tenants`.

Each endpoint's docstring text before `\\f` is shown in the API docs
(`/docs`, `/redoc`); the part after `\\f` is for developers only.
"""

from datetime import datetime, timezone
from importlib.metadata import entry_points
import uuid

from fastapi import APIRouter, Depends, Header, Path, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.database import get_db
from kernel.core.schemas import Page, error_responses
from kernel.core.security import get_actor_id
from kernel.core.services.errors import ForbiddenError, UnauthorizedError, UnprocessableContentError
from kernel.tenancy.models import Tenant, TenantMember, TenantMemberStatus, TenantModule, TenantPlugin
from kernel.tenancy.schemas import (
    ActivationResponse,
    ItemCatalogRead,
    ModuleListResponse,
    PluginListResponse,
    TenantCreate,
    TenantRead,
    TenantUpdate,
)
from kernel.tenancy.services import SlugTakenError, TenantNotFoundError, TenantService
from kernel.user.models.user import User

_bearer_scheme = HTTPBearer(
    auto_error=True,
    scheme_name="BearerAuth",
    description="JWT Bearer access token or personal access token.",
)


async def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> "User":
    from kernel.auth.dependencies import get_current_user
    return await get_current_user(credentials=credentials, session=session)


async def require_super_admin_dep(
    user: "User" = Depends(get_current_user_dep),
) -> "User":
    from kernel.auth.dependencies import require_super_admin
    return await require_super_admin(current_user=user)

TAG = "Tenancy"

router = APIRouter(prefix="/tenants", tags=[TAG])

TenantId = Path(
    description="Unique identifier of the tenant organisation.",
    examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
)


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
    response_description="The created tenant organisation.",
    operation_id="tenants_create",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        SlugTakenError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def create_tenant(
    body: TenantCreate,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Create a new tenant (customer organisation).

    Requires Bearer authentication. If a valid bearer token is sent, its user is
    recorded in `created_by` and `updated_by`. Returns **409** if the slug is already taken.
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
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, UnprocessableContentError),
)
async def list_tenants(
    offset: int = Query(0, ge=0, description="Number of tenants to skip.", examples=[0]),
    limit: int = Query(50, ge=1, le=200, description="Maximum tenants to return (1-200).", examples=[50]),
    include_deleted: bool = Query(False, description="Also return soft-deleted tenants.", examples=[False]),
    service: TenantService = Depends(get_service),
) -> Page[TenantRead]:
    """List tenants with pagination, newest first.

    Requires Bearer authentication. Soft-deleted tenants are hidden unless
    `include_deleted=true` is requested.
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
    response_description="The tenant organisation.",
    operation_id="tenants_get",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def get_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
) -> Tenant:
    """Get one tenant organisation by unique id.

    Requires Bearer authentication. Soft-deleted tenants return 404.
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
    response_description="The updated tenant organisation.",
    operation_id="tenants_update",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        TenantNotFoundError,
        SlugTakenError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def update_tenant(
    body: TenantUpdate,
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Change tenant organisation fields. Only sent fields are modified.

    Requires Bearer authentication. The calling user is recorded in `updated_by`.
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
    summary="Delete a tenant",
    response_description="The tenant organisation, now marked as deleted.",
    operation_id="tenants_delete",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def delete_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Soft-delete a tenant organisation.

    Requires Bearer authentication. The tenant is hidden from standard lists
    but retained in the database. Sets `deleted_at` and `deleted_by`. Undo with
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
    response_description="The tenant organisation, active again.",
    operation_id="tenants_restore",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        TenantNotFoundError,
        UnauthorizedError,
        UnprocessableContentError,
    ),
)
async def restore_tenant(
    tenant_id: uuid.UUID = TenantId,
    service: TenantService = Depends(get_service),
    actor_id: uuid.UUID | None = Depends(get_actor_id),
) -> Tenant:
    """Bring back a soft-deleted tenant organisation.

    Requires Bearer authentication. Clears `deleted_at` and `deleted_by`.
    Calling on an active tenant is harmless and idempotent.
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


# ---------------------------------------------------------------------------
# Business Modules & Extensible Plugins Activation Management
# ---------------------------------------------------------------------------


async def _get_current_tenant_id(
    session: AsyncSession, user: User, explicit_tenant_id: uuid.UUID | None = None
) -> uuid.UUID:
    """Resolve active tenant ID for calling user, respecting explicit header or membership."""
    if explicit_tenant_id:
        return explicit_tenant_id

    res = await session.execute(
        select(TenantMember.tenant_id)
        .where(TenantMember.user_id == user.id, TenantMember.status == TenantMemberStatus.ACTIVE)
        .limit(1)
    )
    tid = res.scalar_one_or_none()
    if tid:
        return tid

    res = await session.execute(
        select(Tenant.id).where(Tenant.deleted_at.is_(None)).limit(1)
    )
    tid = res.scalar_one_or_none()
    if tid:
        return tid
    raise TenantNotFoundError("No active tenant found for user.")


@router.get(
    "/current/modules",
    response_model=ModuleListResponse,
    summary="List business modules for current tenant",
    operation_id="tenants_list_modules",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, TenantNotFoundError),
)
async def list_current_modules(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> ModuleListResponse:
    """Return catalog of business modules and their activation status.

    Requires Bearer authentication. Returns which packages are enabled for the
    current tenant organization context.
    \f
    Args:
        session: Active async database session.
        current_user: Authenticated actor.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        ModuleListResponse containing all discoverable modules and active IDs.
    """
    tenant_id = await _get_current_tenant_id(session, current_user, x_tenant_id)

    res = await session.execute(
        select(TenantModule).where(TenantModule.tenant_id == tenant_id, TenantModule.is_active.is_(True))
    )
    active_records = {m.module_id: m for m in res.scalars().all()}
    active_ids = list(active_records.keys())

    KERNEL_CORE_MODULES = {"setup", "tenancy", "user", "auth"}
    installed: list[ItemCatalogRead] = []

    MODULE_METADATA = {
        "hrms": {
            "name": "HRMS",
            "version": "0.1.0",
            "description": "People and human resources",
            "tags": ["Employees", "Leave", "Payroll"],
            "tone": "chart-3",
        },
        "crm": {
            "name": "CRM",
            "version": "0.1.0",
            "description": "Customers and relationships",
            "tags": ["Leads", "Deals", "Pipeline"],
            "tone": "chart-2",
        },
    }

    try:
        found_eps = {ep.name for ep in entry_points(group="innostes.modules") if ep.name not in KERNEL_CORE_MODULES}
    except Exception:
        found_eps = set()
    all_module_ids = sorted(list(found_eps.union(MODULE_METADATA.keys())))

    for mid in all_module_ids:
        meta = MODULE_METADATA.get(mid, {
            "name": mid.upper(),
            "version": "0.1.0",
            "description": f"{mid.capitalize()} business application",
            "tags": ["Module"],
            "tone": "primary",
        })
        act_record = active_records.get(mid)
        installed.append(
            ItemCatalogRead(
                id=mid,
                name=meta["name"],
                version=meta["version"],
                type="module",
                description=meta["description"],
                tags=meta["tags"],
                tone=meta["tone"],
                is_active=act_record is not None,
                activated_at=act_record.activated_at if act_record else None,
            )
        )

    return ModuleListResponse(installed=installed, active_ids=active_ids)


@router.post(
    "/current/modules/{module_id}/activate",
    response_model=ActivationResponse,
    summary="Activate a business module for tenant",
    operation_id="tenants_activate_module",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        TenantNotFoundError,
        UnprocessableContentError,
    ),
)
async def activate_module(
    module_id: str = Path(description="Package identifier of business module to activate.", examples=["hrms"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> ActivationResponse:
    """Activate a business module for the current tenant.

    Requires Super Administrator privilege. Enables the module's feature set
    and navigation for the organization.
    \f
    Args:
        module_id: Identifier of target module.
        session: Active async database session.
        admin_user: Authenticated administrator.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        ActivationResponse confirming enabled state.
    """
    tenant_id = await _get_current_tenant_id(session, admin_user, x_tenant_id)

    res = await session.execute(
        select(TenantModule).where(TenantModule.tenant_id == tenant_id, TenantModule.module_id == module_id)
    )
    rec = res.scalar_one_or_none()
    now_utc = datetime.now(timezone.utc)
    if rec:
        rec.is_active = True
        rec.activated_at = now_utc
        rec.activated_by = admin_user.id
    else:
        rec = TenantModule(
            tenant_id=tenant_id,
            module_id=module_id,
            is_active=True,
            activated_at=now_utc,
            activated_by=admin_user.id,
        )
        session.add(rec)
    await session.commit()
    return ActivationResponse(
        item_id=module_id,
        is_active=True,
        message=f"Module '{module_id}' activated successfully.",
    )


@router.post(
    "/current/modules/{module_id}/deactivate",
    response_model=ActivationResponse,
    summary="Deactivate a business module for tenant",
    operation_id="tenants_deactivate_module",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        TenantNotFoundError,
        UnprocessableContentError,
    ),
)
async def deactivate_module(
    module_id: str = Path(description="Package identifier of business module to deactivate.", examples=["hrms"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> ActivationResponse:
    """Deactivate a business module for the current tenant.

    Requires Super Administrator privilege. Disables access to module routes
    and navigation.
    \f
    Args:
        module_id: Identifier of target module.
        session: Active async database session.
        admin_user: Authenticated administrator.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        ActivationResponse confirming deactivated state.
    """
    tenant_id = await _get_current_tenant_id(session, admin_user, x_tenant_id)
    res = await session.execute(
        select(TenantModule).where(TenantModule.tenant_id == tenant_id, TenantModule.module_id == module_id)
    )
    rec = res.scalar_one_or_none()
    if rec:
        rec.is_active = False
        rec.activated_at = None
        rec.activated_by = None
        await session.commit()
    return ActivationResponse(
        item_id=module_id,
        is_active=False,
        message=f"Module '{module_id}' deactivated.",
    )


@router.get(
    "/current/plugins",
    response_model=PluginListResponse,
    summary="List extensible plugins for current tenant",
    operation_id="tenants_list_plugins",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(UnauthorizedError, TenantNotFoundError),
)
async def list_current_plugins(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> PluginListResponse:
    """Return catalog of extensible plugins and their activation status.

    Requires Bearer authentication. Returns which plugins are enabled for the
    current tenant organisation context.
    \f
    Args:
        session: Active async database session.
        current_user: Authenticated actor.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        PluginListResponse with all discoverable plugins and active IDs.
    """
    tenant_id = await _get_current_tenant_id(session, current_user, x_tenant_id)

    res = await session.execute(
        select(TenantPlugin).where(TenantPlugin.tenant_id == tenant_id, TenantPlugin.is_active.is_(True))
    )
    active_records = {p.plugin_id: p for p in res.scalars().all()}
    active_ids = list(active_records.keys())

    installed: list[ItemCatalogRead] = []

    PLUGIN_METADATA = {
        "api-logger": {
            "name": "API Logger",
            "version": "0.1.0",
            "description": "API request logging, webhook inspection, and debugging",
            "tags": ["Logs", "Webhooks", "Analytics"],
            "tone": "chart-5",
        }
    }

    try:
        found_eps = {ep.name for ep in entry_points(group="innostes.plugins")}
    except Exception:
        found_eps = set()
    all_plugin_ids = sorted(list(found_eps.union(PLUGIN_METADATA.keys())))

    for pid in all_plugin_ids:
        meta = PLUGIN_METADATA.get(pid, {
            "name": pid.replace("-", " ").title(),
            "version": "0.1.0",
            "description": f"{pid} extensible plugin",
            "tags": ["Plugin"],
            "tone": "primary",
        })
        act_record = active_records.get(pid)
        installed.append(
            ItemCatalogRead(
                id=pid,
                name=meta["name"],
                version=meta["version"],
                type="plugin",
                description=meta["description"],
                tags=meta["tags"],
                tone=meta["tone"],
                is_active=act_record is not None,
                activated_at=act_record.activated_at if act_record else None,
            )
        )

    return PluginListResponse(installed=installed, active_ids=active_ids)


@router.post(
    "/current/plugins/{plugin_id}/activate",
    response_model=ActivationResponse,
    summary="Activate an extensible plugin for tenant",
    operation_id="tenants_activate_plugin",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        TenantNotFoundError,
        UnprocessableContentError,
    ),
)
async def activate_plugin(
    plugin_id: str = Path(description="Package identifier of extensible plugin to activate.", examples=["api-logger"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> ActivationResponse:
    """Activate an extensible plugin for the current tenant.

    Requires Super Administrator privilege. Enables third-party extensions
    and hook listeners for the organization.
    \f
    Args:
        plugin_id: Identifier of target plugin.
        session: Active async database session.
        admin_user: Authenticated administrator.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        ActivationResponse confirming enabled state.
    """
    tenant_id = await _get_current_tenant_id(session, admin_user, x_tenant_id)

    res = await session.execute(
        select(TenantPlugin).where(TenantPlugin.tenant_id == tenant_id, TenantPlugin.plugin_id == plugin_id)
    )
    rec = res.scalar_one_or_none()
    now_utc = datetime.now(timezone.utc)
    if rec:
        rec.is_active = True
        rec.activated_at = now_utc
        rec.activated_by = admin_user.id
    else:
        rec = TenantPlugin(
            tenant_id=tenant_id,
            plugin_id=plugin_id,
            is_active=True,
            activated_at=now_utc,
            activated_by=admin_user.id,
        )
        session.add(rec)
    await session.commit()
    return ActivationResponse(
        item_id=plugin_id,
        is_active=True,
        message=f"Plugin '{plugin_id}' activated successfully.",
    )


@router.post(
    "/current/plugins/{plugin_id}/deactivate",
    response_model=ActivationResponse,
    summary="Deactivate an extensible plugin for tenant",
    operation_id="tenants_deactivate_plugin",
    openapi_extra={"security": [{"BearerAuth": []}]},
    responses=error_responses(
        UnauthorizedError,
        ForbiddenError,
        TenantNotFoundError,
        UnprocessableContentError,
    ),
)
async def deactivate_plugin(
    plugin_id: str = Path(description="Package identifier of extensible plugin to deactivate.", examples=["api-logger"]),
    session: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_super_admin_dep),
    x_tenant_id: uuid.UUID | None = Header(
        default=None,
        alias="X-Tenant-ID",
        description="Active tenant UUID context.",
        examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"],
    ),
) -> ActivationResponse:
    """Deactivate an extensible plugin for the current tenant.

    Requires Super Administrator privilege. Disables third-party extensions
    and hook listeners.
    \f
    Args:
        plugin_id: Identifier of target plugin.
        session: Active async database session.
        admin_user: Authenticated administrator.
        x_tenant_id: Optional explicit tenant context header.

    Returns:
        ActivationResponse confirming deactivated state.
    """
    tenant_id = await _get_current_tenant_id(session, admin_user, x_tenant_id)
    res = await session.execute(
        select(TenantPlugin).where(TenantPlugin.tenant_id == tenant_id, TenantPlugin.plugin_id == plugin_id)
    )
    rec = res.scalar_one_or_none()
    if rec:
        rec.is_active = False
        rec.activated_at = None
        rec.activated_by = None
        await session.commit()
    return ActivationResponse(
        item_id=plugin_id,
        is_active=False,
        message=f"Plugin '{plugin_id}' deactivated.",
    )
