"""User and Enterprise IAM module."""

from kernel.core.module import BaseModule
from kernel.user.models import (
    DeviceStatus,
    DeviceType,
    PasswordHistory,
    Permission,
    Role,
    RolePermission,
    User,
    UserDevice,
    UserIdentity,
    UserProfile,
    UserRole,
    UserSecurity,
    UserSession,
    UserStatus,
)
from kernel.user.router import TAG, router
from kernel.user.schemas import (
    AdminUserInput,
    DeviceWipeRequest,
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RolePermissionAssign,
    RoleRead,
    RoleUpdate,
    UserCreate,
    UserDeviceCreate,
    UserDeviceRead,
    UserProfileRead,
    UserProfileUpdate,
    UserRead,
    UserRoleAssign,
    UserRoleRead,
    UserUpdate,
)
from kernel.user.services import (
    DeviceNotFoundError,
    DeviceService,
    EmailAlreadyExistsError,
    RBACService,
    UserNotFoundError,
    UserService,
    hash_password,
    seed_default_permissions_and_roles,
    seed_default_tenant_settings,
    verify_password,
)


class UserModule(BaseModule):
    """Plugs user identity, access control, and device governance into the API server."""

    name = "user"
    version = "0.1.0"
    description = "User identity, RBAC, and Device Governance"
    router = router
    openapi_tags = [
        {
            "name": TAG,
            "description": "User identity management, authentication credentials, and device controls.",
        }
    ]


module = UserModule()

__all__ = [
    "User",
    "UserStatus",
    "UserProfile",
    "UserSecurity",
    "PasswordHistory",
    "UserDevice",
    "DeviceType",
    "DeviceStatus",
    "UserSession",
    "Permission",
    "Role",
    "RolePermission",
    "UserRole",
    "UserIdentity",
    "AdminUserInput",
    "UserCreate",
    "UserUpdate",
    "UserRead",
    "UserProfileUpdate",
    "UserProfileRead",
    "PermissionCreate",
    "PermissionRead",
    "RoleCreate",
    "RoleUpdate",
    "RoleRead",
    "RolePermissionAssign",
    "UserRoleAssign",
    "UserRoleRead",
    "UserDeviceCreate",
    "UserDeviceRead",
    "DeviceWipeRequest",
    "UserService",
    "EmailAlreadyExistsError",
    "UserNotFoundError",
    "RBACService",
    "DeviceService",
    "DeviceNotFoundError",
    "hash_password",
    "verify_password",
    "seed_default_permissions_and_roles",
    "seed_default_tenant_settings",
    "UserModule",
    "module",
]
