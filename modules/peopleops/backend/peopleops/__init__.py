"""PeopleOps Business Module for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from peopleops.router import router


class PeopleOpsModule(BaseModule):
    """People Operations plug-in module."""

    name: str = "peopleops"
    version: str = "0.1.0"
    description: str = "People operations, employee directory, leaves, and payroll"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "PeopleOps", "description": "People Operations endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }


module = PeopleOpsModule()

__all__ = ["PeopleOpsModule", "module", "router"]
