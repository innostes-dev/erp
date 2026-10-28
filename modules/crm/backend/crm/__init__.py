"""CRM Business Module for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from crm.router import router


class CrmModule(BaseModule):
    """Customer Relationship Management plug-in module."""

    name: str = "crm"
    version: str = "0.1.0"
    description: str = "Customer relationship management and sales pipeline"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "CRM", "description": "Customer Relationship Management endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }


module = CrmModule()

__all__ = ["CrmModule", "module", "router"]
