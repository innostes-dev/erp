"""User Services Export."""

from kernel.user.services.device_service import DeviceNotFoundError, DeviceService
from kernel.user.services.password import hash_password, verify_password
from kernel.user.services.rbac_service import RBACService
from kernel.user.services.seeding import (
    seed_default_permissions_and_roles,
    seed_default_tenant_settings,
)
from kernel.user.services.user_service import (
    EmailAlreadyExistsError,
    UserNotFoundError,
    UserService,
)

__all__ = [
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
]
