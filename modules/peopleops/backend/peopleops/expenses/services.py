"""Business logic service for PeopleOps Expenses."""

import logging
from typing import Any
import uuid
from datetime import datetime

from peopleops.expenses.schemas import ExpenseClaimCreate

logger = logging.getLogger(__name__)


class ExpensesService:
    """Service layer executing business rules for expenses."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for expenses."""
        return {"submodule": "expenses", "ready": True}

    async def get_categories(self) -> dict[str, Any]:
        """Return expense categories."""
        # Simulated categories logic
        return {
            "categories": [
                {
                    "id": str(uuid.uuid4()),
                    "code": "TRAVEL_CONVEYANCE",
                    "name": "Travel & Conveyance",
                    "max_limit_per_claim": 10000.0,
                    "is_receipt_mandatory": True,
                },
                {
                    "id": str(uuid.uuid4()),
                    "code": "MEALS_ENTERTAINMENT",
                    "name": "Meals & Entertainment",
                    "max_limit_per_claim": 5000.0,
                    "is_receipt_mandatory": True,
                }
            ]
        }

    async def get_claims(self) -> dict[str, Any]:
        """Return expense claims."""
        # Simulated claims data
        return {
            "claims": [
                {
                    "id": "EXP-001",
                    "title": "Client Pitch Mumbai",
                    "total_amount": 14020.00,
                    "status": "APPROVED",
                }
            ]
        }

    async def submit_claim(self, payload: ExpenseClaimCreate) -> dict[str, Any]:
        """Submit a new expense claim."""
        # Verification logic here
        total_amount = sum(item.amount for item in payload.line_items)
        total_tax_amount = sum(item.tax_amount for item in payload.line_items)

        # Ensure receipt is provided if amount is significant (simulated check)
        for item in payload.line_items:
            if item.amount > 500 and not item.receipt_storage_path:
                raise ValueError("Receipt is mandatory for amounts greater than 500")

        return {
            "claim_id": str(uuid.uuid4()),
            "title": payload.title,
            "total_amount": float(total_amount),
            "total_tax_amount": float(total_tax_amount),
            "status": "PENDING_MANAGER_REVIEW",
            "submitted_at": datetime.utcnow().isoformat()
        }

    async def approve_claim(self, claim_id: str) -> dict[str, Any]:
        """Approve an expense claim."""
        return {
            "claim_id": claim_id,
            "status": "APPROVED_FOR_PAYROLL",
            "settled_at": datetime.utcnow().isoformat()
        }

    async def reject_claim(self, claim_id: str) -> dict[str, Any]:
        """Reject an expense claim."""
        return {
            "claim_id": claim_id,
            "status": "REJECTED"
        }

service = ExpensesService()
