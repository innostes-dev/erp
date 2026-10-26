"""Base Module Contract for Innostes ERP Modules."""

from abc import ABC
from typing import Any
from fastapi import APIRouter, FastAPI


class BaseModule(ABC):
    """Abstract Base Class that every ERP feature module implements.
    
    Modules can supply an APIRouter, custom lifecycle hooks, and health diagnostics.
    """

    name: str = "base-module"
    version: str = "0.1.0"
    description: str = "Base ERP Module"
    router: APIRouter | None = None

    async def on_startup(self, app: FastAPI) -> None:
        """Hook called when the engine application starts up."""
        pass

    async def on_shutdown(self, app: FastAPI) -> None:
        """Hook called when the engine application shuts down."""
        pass

    async def health_check(self) -> dict[str, Any]:
        """Diagnostic health check reported in /health."""
        return {
            "status": "HEALTHY",
            "module": self.name,
            "version": self.version,
        }
