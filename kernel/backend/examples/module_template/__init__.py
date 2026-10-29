"""Invoicing module template package for Innostes ERP.

This package serves as a copyable, gold-standard reference implementation
for creating and documenting new ERP modules according to repository standards
and the API documentation checklists (E1-E17, S1-S8, T1-T3).
"""

from typing import Any
from kernel.core.module import BaseModule
from .router import router

__all__ = ["InvoiceModule", "module", "router"]


class InvoiceModule(BaseModule):
    """Invoicing and customer billing domain module.

    Implements the BaseModule contract, exposing an HTTP router and OpenAPI tag
    metadata for automated documentation rendering.
    """

    name: str = "invoicing"
    version: str = "0.1.0"
    description: str = "Customer invoicing and payment tracking module"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {
            "name": "Invoices",
            "description": "Customer invoicing operations, line-item billing, and payment tracking.",
        }
    ]

    async def health_check(self) -> dict[str, Any]:
        """Return module operational readiness status."""
        return {
            "module": self.name,
            "status": "HEALTHY",
            "version": self.version,
        }


module = InvoiceModule()
