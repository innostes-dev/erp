"""RBAC schemas for permissions, roles, and role assignments."""

from datetime import datetime
import uuid

from pydantic import Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class PermissionCreate(BaseSchema):
    code: str = Field(min_length=1, max_length=100)
    module: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None)


class PermissionRead(AuditReadSchema):
    code: str
    module: str
    name: str
    description: str | None = None


class RoleCreate(BaseSchema):
    tenant_id: uuid.UUID | None = Field(default=None)
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None)
    is_system: bool = Field(default=False)
    hierarchy_level: int = Field(default=0)


class RoleUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None)
    hierarchy_level: int | None = Field(default=None)


class RoleRead(AuditReadSchema):
    tenant_id: uuid.UUID | None = None
    code: str
    name: str
    description: str | None = None
    is_system: bool
    hierarchy_level: int


class RolePermissionAssign(BaseSchema):
    role_id: uuid.UUID
    permission_id: uuid.UUID


class UserRoleAssign(BaseSchema):
    user_id: uuid.UUID
    role_id: uuid.UUID
    tenant_id: uuid.UUID | None = None


class UserRoleRead(AuditReadSchema):
    user_id: uuid.UUID
    role_id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    assigned_by: uuid.UUID | None = None
    assigned_at: datetime
