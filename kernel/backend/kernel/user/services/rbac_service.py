"""Roles, permissions, module grants, and permission checks."""

from datetime import datetime, timezone
from typing import Any
import uuid

from sqlalchemy import ColumnElement, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.services import ForbiddenError
from kernel.user.models.rbac import Permission, Role, RolePermission, UserModuleGrant, UserRole
from kernel.user.models.user import User


def _same_tenant(column: Any, tenant_id: uuid.UUID | None) -> ColumnElement[bool]:
    return column.is_(None) if tenant_id is None else column == tenant_id


def _assignment_applies(user_id: uuid.UUID, tenant_id: uuid.UUID | None) -> list[ColumnElement[bool]]:
    """Conditions for a user's role assignments that count in `tenant_id`.

    Global assignments (tenant_id NULL) count everywhere; expired assignments never count.
    """
    in_scope = UserRole.tenant_id.is_(None) if tenant_id is None else or_(
        UserRole.tenant_id == tenant_id, UserRole.tenant_id.is_(None)
    )
    not_expired = or_(UserRole.expires_at.is_(None), UserRole.expires_at > datetime.now(timezone.utc))
    return [UserRole.user_id == user_id, in_scope, not_expired]


class RBACService:
    # role code -> permission codes, for system roles whose permissions never change
    _system_role_cache: dict[str, set[str]] = {}

    @classmethod
    def set_system_role_cache(cls, role_code: str, permissions: set[str]) -> None:
        cls._system_role_cache[role_code] = permissions

    @classmethod
    def clear_system_role_cache(cls) -> None:
        cls._system_role_cache.clear()

    # ---- setup: permissions, roles, assignments ---------------------------

    async def get_or_create_permission(
        self,
        session: AsyncSession,
        code: str,
        module: str,
        name: str,
        description: str | None = None,
        resource: str | None = None,
        action: str | None = None,
        default_scope: str = "OWN",
    ) -> Permission:
        existing = (await session.execute(select(Permission).where(Permission.code == code))).scalar_one_or_none()
        if existing:
            return existing

        # "module.resource.action" codes fill in resource and action when they aren't given
        parts = code.split(".")
        perm = Permission(
            code=code,
            module=module,
            name=name,
            description=description,
            resource=resource or (parts[1] if len(parts) > 1 else None),
            action=action or (parts[2] if len(parts) > 2 else None),
            default_scope=default_scope,
        )
        session.add(perm)
        await session.flush()
        return perm

    async def get_or_create_role(
        self,
        session: AsyncSession,
        code: str,
        name: str,
        tenant_id: uuid.UUID | None = None,
        is_system: bool = False,
        hierarchy_level: int = 0,
        description: str | None = None,
        module_code: str | None = None,
        can_delegate: bool = False,
        max_delegatable_level: int = 0,
    ) -> Role:
        stmt = select(Role).where(_same_tenant(Role.tenant_id, tenant_id), Role.code == code)
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            return existing

        role = Role(
            code=code,
            name=name,
            tenant_id=tenant_id,
            is_system=is_system,
            hierarchy_level=hierarchy_level,
            description=description,
            module_code=module_code,
            can_delegate=can_delegate,
            max_delegatable_level=max_delegatable_level,
        )
        session.add(role)
        await session.flush()
        return role

    async def assign_permission_to_role(
        self,
        session: AsyncSession,
        role_id: uuid.UUID,
        permission_id: uuid.UUID,
        scope: str = "OWN",
        conditions: dict | None = None,
    ) -> RolePermission:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id, RolePermission.permission_id == permission_id
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            return existing

        link = RolePermission(role_id=role_id, permission_id=permission_id, scope=scope, conditions=conditions)
        session.add(link)
        await session.flush()
        return link

    async def assign_role_to_user(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
        department_id: uuid.UUID | None = None,
        assigned_by: uuid.UUID | None = None,
        expires_at: datetime | None = None,
    ) -> UserRole:
        """Give a user a role in one tenant, or everywhere when `tenant_id` is None."""
        stmt = select(UserRole).where(
            UserRole.user_id == user_id, UserRole.role_id == role_id, _same_tenant(UserRole.tenant_id, tenant_id)
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            return existing

        assignment = UserRole(
            user_id=user_id,
            role_id=role_id,
            tenant_id=tenant_id,
            department_id=department_id,
            assigned_by=assigned_by,
            assigned_at=datetime.now(timezone.utc),
            expires_at=expires_at,
        )
        session.add(assignment)
        await session.flush()
        return assignment

    # ---- delegation ---------------------------------------------------------

    async def can_delegate_role(
        self,
        session: AsyncSession,
        actor_id: uuid.UUID,
        target_role_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
    ) -> bool:
        """May the actor hand out this role?

        Super admins may hand out anything; owners anything below level 80. Others need a role that
        can delegate up to the target's level, and access to the target role's module.
        """
        actor = (await session.execute(select(User).where(User.id == actor_id))).scalar_one_or_none()
        if not actor or actor.is_blocked:
            return False
        if actor.is_super_admin:
            return True

        target = (await session.execute(select(Role).where(Role.id == target_role_id))).scalar_one_or_none()
        if not target:
            return False

        actor_roles = await self.get_user_roles(session, actor_id, tenant_id)
        if not actor_roles:
            return False
        if any(r.code in ("owner", "super_admin") for r in actor_roles):
            return target.hierarchy_level < 80

        delegators = [r for r in actor_roles if r.can_delegate]
        if not delegators or target.hierarchy_level > max(r.max_delegatable_level for r in delegators):
            return False

        if target.module_code:
            grants = set(await self.get_user_module_grants(session, actor_id, tenant_id))
            role_modules = {r.module_code for r in actor_roles if r.module_code}
            if target.module_code not in grants | role_modules:
                return False
        return True

    async def assign_role_with_delegation_check(
        self,
        session: AsyncSession,
        actor_id: uuid.UUID,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
        department_id: uuid.UUID | None = None,
        expires_at: datetime | None = None,
    ) -> UserRole:
        if not await self.can_delegate_role(session, actor_id, role_id, tenant_id):
            raise ForbiddenError("Actor is not authorized to delegate this role (hierarchy or module boundary violated).")
        return await self.assign_role_to_user(
            session=session,
            user_id=user_id,
            role_id=role_id,
            tenant_id=tenant_id,
            department_id=department_id,
            assigned_by=actor_id,
            expires_at=expires_at,
        )

    # ---- module grants -----------------------------------------------------------

    async def grant_module_to_user(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        module_code: str,
        granted_by: uuid.UUID | None = None,
        expires_at: datetime | None = None,
    ) -> UserModuleGrant:
        grant = await self._module_grant(session, tenant_id, user_id, module_code)
        if grant:
            grant.is_active = True
            grant.expires_at = expires_at
        else:
            grant = UserModuleGrant(
                tenant_id=tenant_id,
                user_id=user_id,
                module_code=module_code,
                is_active=True,
                granted_by=granted_by,
                granted_at=datetime.now(timezone.utc),
                expires_at=expires_at,
            )
            session.add(grant)
        await session.flush()
        return grant

    async def revoke_module_from_user(
        self, session: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, module_code: str
    ) -> bool:
        grant = await self._module_grant(session, tenant_id, user_id, module_code)
        if not grant:
            return False
        grant.is_active = False
        await session.flush()
        return True

    async def get_user_module_grants(self, session: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID) -> list[str]:
        """Module codes granted to the user directly (active and not expired)."""
        stmt = select(UserModuleGrant.module_code).where(
            UserModuleGrant.tenant_id == tenant_id,
            UserModuleGrant.user_id == user_id,
            UserModuleGrant.is_active.is_(True),
            or_(UserModuleGrant.expires_at.is_(None), UserModuleGrant.expires_at > datetime.now(timezone.utc)),
        )
        return list((await session.execute(stmt)).scalars().all())

    async def _module_grant(
        self, session: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, module_code: str
    ) -> UserModuleGrant | None:
        stmt = select(UserModuleGrant).where(
            UserModuleGrant.tenant_id == tenant_id,
            UserModuleGrant.user_id == user_id,
            UserModuleGrant.module_code == module_code,
        )
        return (await session.execute(stmt)).scalar_one_or_none()

    # ---- what a user holds -----------------------------------------------------

    async def get_user_roles(
        self, session: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> list[Role]:
        stmt = select(Role).join(UserRole, UserRole.role_id == Role.id).where(*_assignment_applies(user_id, tenant_id))
        return list((await session.execute(stmt)).scalars().all())

    async def get_user_permissions(
        self, session: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> list[dict[str, Any]]:
        """Every permission the user holds through their roles, with the scope each role grants."""
        stmt = (
            select(
                Permission.code,
                Permission.module,
                Permission.resource,
                Permission.action,
                RolePermission.scope,
                Role.code.label("role_code"),
                Role.hierarchy_level,
            )
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(*_assignment_applies(user_id, tenant_id))
        )
        return [
            {
                "code": r.code,
                "module": r.module,
                "resource": r.resource,
                "action": r.action,
                "scope": r.scope or "OWN",
                "role_code": r.role_code,
                "hierarchy_level": r.hierarchy_level,
            }
            for r in (await session.execute(stmt)).all()
        ]

    async def has_permission(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        permission_code: str,
        tenant_id: uuid.UUID | None = None,
    ) -> bool:
        user_stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        user = (await session.execute(user_stmt)).scalar_one_or_none()
        if not user or user.is_blocked:
            return False
        if user.is_super_admin:
            return True

        for role in await self.get_user_roles(session, user_id, tenant_id):
            cached = self._system_role_cache.get(role.code)
            if cached is not None and ("*" in cached or permission_code in cached):
                return True

        stmt = (
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(Permission.code == permission_code, *_assignment_applies(user_id, tenant_id))
        )
        return (await session.execute(stmt)).scalar_one_or_none() is not None
