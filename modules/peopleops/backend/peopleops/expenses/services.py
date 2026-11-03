"""Business logic service for PeopleOps Expenses."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class ExpensesService:
    """Service layer executing business rules for expenses."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for expenses."""
        return {"submodule": "expenses", "ready": True}


service = ExpensesService()
