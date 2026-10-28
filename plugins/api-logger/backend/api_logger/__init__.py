"""API Logger Extensible Plugin for Innostes ERP."""

from typing import Any
from kernel.core.module import BaseModule
from api_logger.router import router


class ApiLoggerPlugin(BaseModule):
    """API request logging and webhook monitoring plugin."""

    name: str = "api-logger"
    version: str = "0.1.0"
    description: str = "API request logging, webhook inspection, and debugging"
    router = router
    openapi_tags: list[dict[str, Any]] = [
        {"name": "API Logger", "description": "API Logger extensible plugin endpoints."}
    ]

    async def health_check(self) -> dict[str, Any]:
        return {
            "status": "HEALTHY",
            "plugin": self.name,
            "version": self.version,
        }


plugin = ApiLoggerPlugin()

__all__ = ["ApiLoggerPlugin", "plugin", "router"]
