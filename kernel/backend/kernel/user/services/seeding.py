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
    ("kernel.setup.read", "kernel", "View setup state and checks", "setup", "read", "ORGANIZATION"),
    ("kernel.setup.install", "kernel", "Execute initial platform setup", "setup", "install", "ORGANIZATION"),
    ("kernel.config.read", "kernel", "Read service runtime configuration", "config", "read", "ORGANIZATION"),
    # Tenancy
    ("tenancy.tenant.read", "tenancy", "View organization details", "tenant", "read", "ORGANIZATION"),
    ("tenancy.tenant.update", "tenancy", "Update organization details", "tenant", "update", "ORGANIZATION"),
    ("tenancy.tenant.delete", "tenancy", "Delete organization", "tenant", "delete", "ORGANIZATION"),
    ("tenancy.settings.read", "tenancy", "Read modular tenant settings", "settings", "read", "ORGANIZATION"),
    ("tenancy.settings.update", "tenancy", "Modify modular tenant settings", "settings", "update", "ORGANIZATION"),
    ("tenancy.members.manage", "tenancy", "Invite and manage company members", "members", "manage", "ORGANIZATION"),
    # User & IAM
    ("user.users.create", "user", "Create user accounts", "users", "create", "ORGANIZATION"),
    ("user.users.read", "user", "View user accounts and profiles", "users", "read", "ORGANIZATION"),
    ("user.users.update", "user", "Update user accounts", "users", "update", "ORGANIZATION"),
    ("user.users.delete", "user", "Suspend or delete user accounts", "users", "delete", "ORGANIZATION"),
    ("user.roles.manage", "user", "Assign and customize security roles", "roles", "manage", "ORGANIZATION"),
    ("user.devices.manage", "user", "View and manage registered devices", "devices", "manage", "ORGANIZATION"),
    ("user.devices.wipe", "user", "Trigger remote wipe on devices", "devices", "wipe", "ORGANIZATION"),
    # SalesFlow CRM
    ("salesflow.leads.read", "salesflow", "View CRM leads", "leads", "read", "OWN"),
    ("salesflow.leads.create", "salesflow", "Create new CRM leads", "leads", "create", "OWN"),
    ("salesflow.leads.update", "salesflow", "Modify CRM leads", "leads", "update", "OWN"),
    ("salesflow.deals.read", "salesflow", "View revenue deals & pipeline", "deals", "read", "OWN"),
    ("salesflow.deals.manage", "salesflow", "Create, close and manage deals", "deals", "manage", "DEPARTMENT"),
    ("salesflow.pipeline.manage", "salesflow", "Configure pipeline stages and quotas", "pipeline", "manage", "ORGANIZATION"),
    # PeopleOps HRMS
    ("peopleops.directory.read", "peopleops", "View employee directory", "directory", "read", "ORGANIZATION"),
    ("peopleops.leave.apply", "peopleops", "Submit leave requests", "leave", "apply", "OWN"),
    ("peopleops.leave.approve", "peopleops", "Approve team leave requests", "leave", "approve", "DEPARTMENT"),
    ("peopleops.payroll.view", "peopleops", "View compensation and paystubs", "payroll", "read", "OWN"),
    ("peopleops.payroll.manage", "peopleops", "Run payroll and manage compensation", "payroll", "manage", "ORGANIZATION"),
    # Tracura Telemetry
    ("tracura.logs.read", "tracura", "Query telemetry and logs", "logs", "read", "ORGANIZATION"),
    ("tracura.projects.manage", "tracura", "Create and configure telemetry projects", "projects", "manage", "ORGANIZATION"),
    ("tracura.keys.manage", "tracura", "Issue and revoke ingestion API keys", "keys", "manage", "ORGANIZATION"),
]

ROLE_DEFINITIONS = [
    ("super_admin", "Super Administrator", 100, "Global platform super administrator with unrestricted access.", "ALL", None, True, 100),
    (
        "owner",
        "Organization Owner",
        80,
        "Full administrative control over tenant resources and members.",
        "ALL",
        None,
        True,
        79,
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
            "salesflow.leads.read",
            "salesflow.deals.read",
            "peopleops.directory.read",
            "tracura.logs.read",
        ],
        None,
        True,
        49,
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
            "peopleops.directory.read",
        ],
        None,
        False,
        0,
    ),
    (
        "sales_manager",
        "Sales Manager",
        40,
        "Departmental manager with team-wide lead & deal authority.",
        [
            "salesflow.leads.read",
            "salesflow.leads.create",
            "salesflow.leads.update",
            "salesflow.deals.read",
            "salesflow.deals.manage",
            "salesflow.pipeline.manage",
        ],
        "salesflow",
        True,
        30,
    ),
    (
        "sales_rep",
        "Sales Representative",
        20,
        "Individual contributor managing assigned sales pipeline.",
        [
            "salesflow.leads.read",
            "salesflow.leads.create",
            "salesflow.leads.update",
            "salesflow.deals.read",
        ],
        "salesflow",
        False,
        0,
    ),
    (
        "hr_manager",
        "HR Manager",
        45,
        "Departmental HR manager overseeing workforce and leave.",
        [
            "peopleops.directory.read",
            "peopleops.leave.apply",
            "peopleops.leave.approve",
            "peopleops.payroll.view",
            "peopleops.payroll.manage",
        ],
        "peopleops",
        True,
        30,
    ),
    (
        "employee",
        "Employee",
        15,
        "Standard employee self-service access.",
        [
            "peopleops.directory.read",
            "peopleops.leave.apply",
            "peopleops.payroll.view",
        ],
        "peopleops",
        False,
        0,
    ),
    (
        "telemetry_engineer",
        "Telemetry Engineer",
        35,
        "Observability specialist managing logs, keys and tracing.",
        [
            "tracura.logs.read",
            "tracura.projects.manage",
            "tracura.keys.manage",
        ],
        "tracura",
        False,
        0,
    ),
]


async def seed_default_permissions_and_roles(session: AsyncSession) -> dict[str, Role]:
    """Seed baseline atomic permissions and core system security roles."""
    rbac = RBACService()
    created_perms: dict[str, Permission] = {}

    for item in DEFAULT_PERMISSIONS:
        code = item[0]
        mod = item[1]
        desc = item[2]
        resource = item[3] if len(item) > 3 else None
        action = item[4] if len(item) > 4 else None
        default_scope = item[5] if len(item) > 5 else "ORGANIZATION"

        name = code.split(".")[-1].capitalize()
        perm = await rbac.get_or_create_permission(
            session=session,
            code=code,
            module=mod,
            name=name,
            description=desc,
            resource=resource,
            action=action,
            default_scope=default_scope,
        )
        created_perms[code] = perm

    created_roles: dict[str, Role] = {}
    for item in ROLE_DEFINITIONS:
        code = item[0]
        name = item[1]
        level = item[2]
        desc = item[3]
        granted = item[4]
        module_code = item[5] if len(item) > 5 else None
        can_delegate = item[6] if len(item) > 6 else False
        max_delegatable_level = item[7] if len(item) > 7 else 0

        role = await rbac.get_or_create_role(
            session=session,
            code=code,
            name=name,
            tenant_id=None,
            is_system=True,
            hierarchy_level=level,
            description=desc,
            module_code=module_code,
            can_delegate=can_delegate,
            max_delegatable_level=max_delegatable_level,
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
