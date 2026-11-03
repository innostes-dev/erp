"""Business logic service for PeopleOps Core."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class CoreService:
    """Service layer executing business rules for core."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for core."""
        return {"submodule": "core", "ready": True}


service = CoreService()
