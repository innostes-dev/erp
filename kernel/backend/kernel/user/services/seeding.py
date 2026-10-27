"""Seeding utilities for RBAC permissions, system roles, and modular tenant settings."""

from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.tenancy.models.settings import TenantSetting
from kernel.user.models.rbac import Permission, Role, RolePermission
from kernel.user.services.rbac_service import RBACService

DEFAULT_PERMISSIONS = [
    # Kernel & Setup
    ("kernel.setup.read", "kernel", "View setup state and checks"),
    ("kernel.setup.install", "kernel", "Execute initial platform setup"),
    ("kernel.config.read", "kernel", "Read service runtime configuration"),
    # Tenancy
    ("tenancy.tenant.read", "tenancy", "View organization details"),
    ("tenancy.tenant.update", "tenancy", "Update organization details"),
    ("tenancy.tenant.delete", "tenancy", "Delete organization"),
    ("tenancy.settings.read", "tenancy", "Read modular tenant settings"),
    ("tenancy.settings.update", "tenancy", "Modify modular tenant settings"),
    ("tenancy.members.manage", "tenancy", "Invite and manage company members"),
    # User & IAM
    ("user.users.create", "user", "Create user accounts"),
    ("user.users.read", "user", "View user accounts and profiles"),
    ("user.users.update", "user", "Update user accounts"),
    ("user.users.delete", "user", "Suspend or delete user accounts"),
    ("user.roles.manage", "user", "Assign and customize security roles"),
    ("user.devices.manage", "user", "View and manage registered devices"),
    ("user.devices.wipe", "user", "Trigger remote wipe on devices"),
]

ROLE_DEFINITIONS = [
    ("super_admin", "Super Administrator", 100, "Global platform super administrator with unrestricted access.", "ALL"),
    (
        "owner",
        "Organization Owner",
        80,
        "Full administrative control over tenant resources and members.",
        [
            "kernel.config.read",
            "tenancy.tenant.read",
            "tenancy.tenant.update",
            "tenancy.settings.read",
            "tenancy.settings.update",
            "tenancy.members.manage",
            "user.users.create",
            "user.users.read",
            "user.users.update",
            "user.users.delete",
            "user.roles.manage",
            "user.devices.manage",
            "user.devices.wipe",
        ],
    ),
    (
        "admin",
        "Administrator",
        50,
        "Operational administrator for company settings and users.",
        [
            "kernel.config.read",
            "tenancy.tenant.read",
            "tenancy.tenant.update",
            "tenancy.settings.read",
            "tenancy.settings.update",
            "tenancy.members.manage",
            "user.users.create",
            "user.users.read",
            "user.users.update",
            "user.devices.manage",
            "user.devices.wipe",
        ],
    ),
    (
        "member",
        "Member",
        10,
        "Standard organization member with read access.",
        [
            "kernel.config.read",
            "tenancy.tenant.read",
            "tenancy.settings.read",
            "user.users.read",
        ],
    ),
]


async def seed_default_permissions_and_roles(session: AsyncSession) -> dict[str, Role]:
    """Seed baseline atomic permissions and core system security roles."""
    rbac = RBACService()
    created_perms: dict[str, Permission] = {}

    for code, mod, desc in DEFAULT_PERMISSIONS:
        name = code.split(".")[-1].capitalize()
        perm = await rbac.get_or_create_permission(
            session=session,
            code=code,
            module=mod,
            name=name,
            description=desc,
        )
        created_perms[code] = perm

    created_roles: dict[str, Role] = {}
    for code, name, level, desc, granted in ROLE_DEFINITIONS:
        role = await rbac.get_or_create_role(
            session=session,
            code=code,
            name=name,
            tenant_id=None,
            is_system=True,
            hierarchy_level=level,
            description=desc,
        )
        created_roles[code] = role

        if granted == "ALL":
            for perm in created_perms.values():
                await rbac.assign_permission_to_role(session, role.id, perm.id)
        else:
            for perm_code in granted:
                if perm_code in created_perms:
                    await rbac.assign_permission_to_role(session, role.id, created_perms[perm_code].id)

    return created_roles


async def seed_default_tenant_settings(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    organization_name: str,
    branding_input: dict[str, Any] | None = None,
    timezone: str = "UTC",
    language: str = "en-US",
    date_format: str = "YYYY-MM-DD",
) -> None:
    """Initialize scoped namespace settings (branding, auth, localization) for a tenant."""
    branding_data = {
        "theme": branding_input.get("theme", "system") if branding_input else "system",
        "primary_color": branding_input.get("primary_color", "#2563EB") if branding_input else "#2563EB",
        "accent_color": "#4F46E5",
        "company_display_name": organization_name,
        "logo_url": branding_input.get("logo_url") if branding_input else None,
        "favicon_url": None,
    }

    auth_data = {
        "mfa_enforced": False,
        "session_idle_timeout_minutes": 60,
        "max_login_attempts": 5,
    }

    localization_data = {
        "timezone": timezone,
        "language": language,
        "date_format": date_format,
        "time_format": "24h",
        "currency": "USD",
    }

    namespaces = [
        ("branding", branding_data),
        ("auth", auth_data),
        ("localization", localization_data),
    ]

    for ns, cfg in namespaces:
        stmt = select(TenantSetting).where(
            TenantSetting.tenant_id == tenant_id,
            TenantSetting.namespace == ns,
        )
        res = await session.execute(stmt)
        setting = res.scalar_one_or_none()
        if setting:
            setting.config = cfg
        else:
            setting = TenantSetting(
                tenant_id=tenant_id,
                namespace=ns,
                config=cfg,
                version=1,
            )
            session.add(setting)

    await session.flush()
