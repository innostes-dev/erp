"""RBAC service handling permissions, roles, and unified role assignments."""

from datetime import datetime, timezone
from typing import Any
import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from kernel.user.models.rbac import Permission, Role, RolePermission, UserModuleGrant, UserRole
from kernel.user.models.user import User


class RBACService:
    """Service governing role assignments, permission checking, and authorization."""

    # In-memory fast cache for system role permissions: role_code -> set of permission codes
    _system_role_cache: dict[str, set[str]] = {}

    @classmethod
    def set_system_role_cache(cls, role_code: str, permissions: set[str]) -> None:
        """Cache static permission sets for system roles to bypass DB lookups."""
        cls._system_role_cache[role_code] = permissions

    @classmethod
    def clear_system_role_cache(cls) -> None:
        """Clear cached system role permissions."""
        cls._system_role_cache.clear()

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
        """Find existing permission by unique code or create a new one."""
        stmt = select(Permission).where(Permission.code == code)
        result = await session.execute(stmt)
        perm = result.scalar_one_or_none()
        if perm:
            return perm

        # Auto-derive resource and action from dot notation if not provided
        if not resource and "." in code:
            parts = code.split(".")
            if len(parts) >= 2:
                resource = parts[1]
        if not action and "." in code:
            parts = code.split(".")
            if len(parts) >= 3:
                action = parts[2]

        perm = Permission(
            code=code,
            module=module,
            name=name,
            description=description,
            resource=resource,
            action=action,
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
        """Find existing role by tenant and code or create a new one."""
        if tenant_id is None:
            stmt = select(Role).where(Role.tenant_id.is_(None), Role.code == code)
        else:
            stmt = select(Role).where(Role.tenant_id == tenant_id, Role.code == code)
        result = await session.execute(stmt)
        role = result.scalar_one_or_none()
        if role:
            return role

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
        """Link a permission to a role if not already associated."""
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        result = await session.execute(stmt)
        rp = result.scalar_one_or_none()
        if rp:
            return rp

        rp = RolePermission(
            role_id=role_id,
            permission_id=permission_id,
            scope=scope,
            conditions=conditions,
        )
        session.add(rp)
        await session.flush()
        return rp

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
        """Assign role to user, scoped globally (`tenant_id=None`) or to a specific tenant."""
        if tenant_id is None:
            stmt = select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id,
                UserRole.tenant_id.is_(None),
            )
        else:
            stmt = select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id,
                UserRole.tenant_id == tenant_id,
            )
        result = await session.execute(stmt)
        ur = result.scalar_one_or_none()
        if ur:
            return ur

        ur = UserRole(
            user_id=user_id,
            role_id=role_id,
            tenant_id=tenant_id,
            department_id=department_id,
            assigned_by=assigned_by,
            assigned_at=datetime.now(timezone.utc),
            expires_at=expires_at,
        )
        session.add(ur)
        await session.flush()
        return ur

    async def can_delegate_role(
        self,
        session: AsyncSession,
        actor_id: uuid.UUID,
        target_role_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
    ) -> bool:
        """Verify whether an actor is mathematically permitted to delegate target_role_id.

        Invariants enforced:
        1. Hierarchy Invariant: target_role.hierarchy_level <= actor.max_delegatable_level
        2. Module Invariant: actor must hold entitlement to target_role.module_code (if module-scoped)
        3. Super admin bypasses all delegation limits
        """
        actor_stmt = select(User).where(User.id == actor_id)
        actor = (await session.execute(actor_stmt)).scalar_one_or_none()
        if not actor or actor.is_blocked:
            return False
        if actor.is_super_admin:
            return True

        target_role_stmt = select(Role).where(Role.id == target_role_id)
        target_role = (await session.execute(target_role_stmt)).scalar_one_or_none()
        if not target_role:
            return False

        actor_roles = await self.get_user_roles(session, actor_id, tenant_id)
        if not actor_roles:
            return False

        # Owner has full delegation within tenant up to level 79
        if any(r.code in ("owner", "super_admin") for r in actor_roles):
            return target_role.hierarchy_level < 80

        # Check actor's delegation capability
        delegators = [r for r in actor_roles if r.can_delegate]
        if not delegators:
            return False

        max_delegatable = max(r.max_delegatable_level for r in delegators)
        if target_role.hierarchy_level > max_delegatable:
            return False

        # If role is module-specific, actor must have entitlement to that module
        if target_role.module_code:
            grants = set(await self.get_user_module_grants(session, actor_id, tenant_id))
            role_mods = {r.module_code for r in actor_roles if r.module_code}
            if target_role.module_code not in grants and target_role.module_code not in role_mods:
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
        """Assign role only after verifying delegation invariants to prevent privilege escalation."""
        allowed = await self.can_delegate_role(session, actor_id, role_id, tenant_id)
        if not allowed:
            from kernel.core.services import ForbiddenError
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

    async def grant_module_to_user(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        module_code: str,
        granted_by: uuid.UUID | None = None,
        expires_at: datetime | None = None,
    ) -> UserModuleGrant:
        """Grant access to a domain module for a user within a tenant."""
        stmt = select(UserModuleGrant).where(
            UserModuleGrant.tenant_id == tenant_id,
            UserModuleGrant.user_id == user_id,
            UserModuleGrant.module_code == module_code,
        )
        result = await session.execute(stmt)
        grant = result.scalar_one_or_none()
        if grant:
            grant.is_active = True
            grant.expires_at = expires_at
            await session.flush()
            return grant

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
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        module_code: str,
    ) -> bool:
        """Revoke a domain module grant from a user."""
        stmt = select(UserModuleGrant).where(
            UserModuleGrant.tenant_id == tenant_id,
            UserModuleGrant.user_id == user_id,
            UserModuleGrant.module_code == module_code,
        )
        result = await session.execute(stmt)
        grant = result.scalar_one_or_none()
        if grant:
            grant.is_active = False
            await session.flush()
            return True
        return False

    async def get_user_module_grants(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[str]:
        """Fetch list of active module codes explicitly granted to user."""
        now_utc = datetime.now(timezone.utc)
        stmt = (
            select(UserModuleGrant.module_code)
            .where(
                UserModuleGrant.tenant_id == tenant_id,
                UserModuleGrant.user_id == user_id,
                UserModuleGrant.is_active.is_(True),
                or_(UserModuleGrant.expires_at.is_(None), UserModuleGrant.expires_at > now_utc),
            )
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_roles(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
    ) -> list[Role]:
        """Fetch all assigned roles for user within tenant or globally."""
        now_utc = datetime.now(timezone.utc)
        if tenant_id is None:
            scope_cond = UserRole.tenant_id.is_(None)
        else:
            scope_cond = or_(UserRole.tenant_id == tenant_id, UserRole.tenant_id.is_(None))

        stmt = (
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                scope_cond,
                or_(UserRole.expires_at.is_(None), UserRole.expires_at > now_utc),
            )
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_permissions(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch list of all effective permissions held by user."""
        now_utc = datetime.now(timezone.utc)
        if tenant_id is None:
            scope_cond = UserRole.tenant_id.is_(None)
        else:
            scope_cond = or_(UserRole.tenant_id == tenant_id, UserRole.tenant_id.is_(None))

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
            .where(
                UserRole.user_id == user_id,
                scope_cond,
                or_(UserRole.expires_at.is_(None), UserRole.expires_at > now_utc),
            )
        )
        result = await session.execute(stmt)
        rows = result.all()
        return [
            {
                "code": getattr(r, "code", r.get("code") if isinstance(r, dict) else None),
                "module": getattr(r, "module", r.get("module") if isinstance(r, dict) else None),
                "resource": getattr(r, "resource", r.get("resource") if isinstance(r, dict) else None),
                "action": getattr(r, "action", r.get("action") if isinstance(r, dict) else None),
                "scope": getattr(r, "scope", r.get("scope") if isinstance(r, dict) else "OWN") or "OWN",
                "role_code": getattr(r, "role_code", r.get("role_code") if isinstance(r, dict) else None),
                "hierarchy_level": getattr(r, "hierarchy_level", r.get("hierarchy_level") if isinstance(r, dict) else 0),
            }
            for r in rows
        ]

    async def has_permission(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        permission_code: str,
        tenant_id: uuid.UUID | None = None,
    ) -> bool:
        """Verify whether user holds the requested permission either globally or within tenant."""
        # Check if user is super admin
        user_stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        if not user or user.is_blocked:
            return False
        if user.is_super_admin:
            return True

        # Check in-memory system role cache for ultra-fast nanosecond resolution
        user_roles = await self.get_user_roles(session, user_id, tenant_id)
        for r in user_roles:
            cached_perms = self._system_role_cache.get(r.code)
            if cached_perms is not None:
                if "*" in cached_perms or permission_code in cached_perms:
                    return True

        # Query assigned roles matching the tenant or global scope
        now_utc = datetime.now(timezone.utc)
        if tenant_id is None:
            scope_cond = UserRole.tenant_id.is_(None)
        else:
            scope_cond = (UserRole.tenant_id == tenant_id) | (UserRole.tenant_id.is_(None))

        perm_stmt = (
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                scope_cond,
                Permission.code == permission_code,
                or_(UserRole.expires_at.is_(None), UserRole.expires_at > now_utc),
            )
        )
        perm_res = await session.execute(perm_stmt)
        return perm_res.scalar_one_or_none() is not None

