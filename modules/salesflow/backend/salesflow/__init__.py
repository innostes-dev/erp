"""SalesFlow Business Module for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from salesflow.router import router


class SalesFlowModule(BaseModule):
    """SalesFlow sales pipeline and deals module."""

    name: str = "salesflow"
    version: str = "0.1.0"
    description: str = "SalesFlow sales pipeline, customer leads, deals, and accounts"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "SalesFlow", "description": "SalesFlow sales pipeline endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }


module = SalesFlowModule()

__all__ = ["SalesFlowModule", "module", "router"]
