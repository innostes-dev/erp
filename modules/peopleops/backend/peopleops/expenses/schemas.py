"""Pydantic schemas for PeopleOps Expenses."""

from typing import Any
from pydantic import ConfigDict, Field
from kernel.core.schemas import BaseSchema


class ExpensesBaseResponse(BaseSchema):
    """Standard success schema for expenses operations."""

    status: str = Field(default="ok", description="Operation status string.")
    message: str = Field(default="Operation completed successfully.", description="Status narrative.")
    data: dict[str, Any] = Field(default_factory=dict, description="Payload data mapping.")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "status": "ok",
                    "message": "Operation completed successfully.",
                    "data": {},
                }
            ]
        }
    )

from typing import List, Optional
from datetime import date
from decimal import Decimal
from uuid import UUID

class ExpenseLineItemCreate(BaseSchema):
    """Schema for creating an expense line item."""
    category_id: UUID = Field(description="The ID of the expense category.")
    expense_date: date = Field(description="The date of the expense.")
    merchant_name: str = Field(description="The name of the merchant.", min_length=1)
    amount: Decimal = Field(description="The amount of the expense.", ge=0)
    tax_amount: Decimal = Field(default=Decimal("0.00"), description="The tax amount of the expense.", ge=0)
    receipt_storage_path: Optional[str] = Field(default=None, description="The path to the receipt storage.")
    is_billable_to_client: bool = Field(default=False, description="Whether the expense is billable to the client.")

class ExpenseClaimCreate(BaseSchema):
    """Schema for creating an expense claim report."""
    title: str = Field(description="The title of the expense claim report.", min_length=1)
    business_purpose: str = Field(description="The business purpose of the expense claim report.", min_length=1)
    cost_center: Optional[str] = Field(default=None, description="The cost center for the expense claim report.")
    settlement_destination: str = Field(default="NEXT_PAYROLL", description="The settlement destination for the expense claim report.")
    line_items: List[ExpenseLineItemCreate] = Field(description="The line items for the expense claim report.", min_length=1)
