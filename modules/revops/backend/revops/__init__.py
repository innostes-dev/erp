"""RevOps Business Module for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from revops.router import router


class RevOpsModule(BaseModule):
    """Revenue Operations and sales pipeline module."""

    name: str = "revops"
    version: str = "0.1.0"
    description: str = "Revenue operations, customer pipeline, deals, and accounts"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "RevOps", "description": "Revenue Operations endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }


module = RevOpsModule()

__all__ = ["RevOpsModule", "module", "router"]
