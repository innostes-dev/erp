"""HRMS Business Module for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from hrms.router import router


class HrmsModule(BaseModule):
    """Human Resource Management System plug-in module."""

    name: str = "hrms"
    version: str = "0.1.0"
    description: str = "People and human resources management"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "HRMS", "description": "Human Resource Management System endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }


module = HrmsModule()

__all__ = ["HrmsModule", "module", "router"]
