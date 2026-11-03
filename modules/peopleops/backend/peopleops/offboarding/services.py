"""Business logic service for PeopleOps Offboarding."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class OffboardingService:
    """Service layer executing business rules for offboarding."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for offboarding."""
        return {"submodule": "offboarding", "ready": True}


service = OffboardingService()
