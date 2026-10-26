"""Tenancy feature: tenants (customer organisations) of the ERP.

Public API: import from `kernel.tenancy`, not from its sub-packages.

Layout:
    models/    SQLAlchemy tables (`Tenant`)
    schemas/   Pydantic request/response bodies
    services/  Business logic (`TenantService`)
    router.py  HTTP endpoints under `/tenants`

Register with the API server:
    ```python
    loader.load_modules(["kernel.tenancy"])
    ```
"""

from kernel.core.module import BaseModule
from kernel.tenancy.models import Tenant
from kernel.tenancy.router import TAG, router
from kernel.tenancy.schemas import TenantCreate, TenantRead, TenantUpdate
from kernel.tenancy.services import SlugTakenError, TenantNotFoundError, TenantService


class TenancyModule(BaseModule):
    """Plugs the tenancy feature (routes + API docs section) into the API server."""

    name = "tenancy"
    version = "0.1.0"
    description = "Tenant management"
    router = router
    openapi_tags = [
        {
            "name": TAG,
            "description": (
                "Tenants are the customer organisations using the ERP. "
                "Every business record belongs to a tenant. Deleting a tenant "
                "is a soft delete and can be undone with *restore*."
            ),
        }
    ]


module = TenancyModule()
"""Ready-made instance picked up by `ModuleLoader`."""

__all__ = [
    "Tenant",
    "TenantCreate",
    "TenantUpdate",
    "TenantRead",
    "TenantService",
    "SlugTakenError",
    "TenantNotFoundError",
    "TenancyModule",
    "module",
    "router",
]
