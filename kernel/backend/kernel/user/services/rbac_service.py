"""RBAC service handling permissions, roles, and unified role assignments."""

from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from kernel.user.models.rbac import Permission, Role, RolePermission, UserRole
from kernel.user.models.user import User


class RBACService:
    """Service governing role assignments, permission checking, and authorization."""

    async def get_or_create_permission(
        self,
        session: AsyncSession,
        code: str,
        module: str,
        name: str,
        description: str | None = None,
    ) -> Permission:
        """Find existing permission by unique code or create a new one."""
        stmt = select(Permission).where(Permission.code == code)
        result = await session.execute(stmt)
        perm = result.scalar_one_or_none()
        if perm:
            return perm

        perm = Permission(code=code, module=module, name=name, description=description)
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
        )
        session.add(role)
        await session.flush()
        return role

    async def assign_permission_to_role(
        self,
        session: AsyncSession,
        role_id: uuid.UUID,
        permission_id: uuid.UUID,
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

        rp = RolePermission(role_id=role_id, permission_id=permission_id)
        session.add(rp)
        await session.flush()
        return rp

    async def assign_role_to_user(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
        assigned_by: uuid.UUID | None = None,
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
            assigned_by=assigned_by,
            assigned_at=datetime.now(timezone.utc),
        )
        session.add(ur)
        await session.flush()
        return ur

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

        # Query assigned roles matching the tenant or global scope
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
            )
        )
        perm_res = await session.execute(perm_stmt)
        return perm_res.scalar_one_or_none() is not None
