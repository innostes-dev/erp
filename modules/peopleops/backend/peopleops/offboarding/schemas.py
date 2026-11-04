"""Pydantic schemas for PeopleOps Offboarding."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from pydantic import ConfigDict, Field

from kernel.core.schemas.base import BaseSchema, AuditReadSchema

class OffboardingBaseResponse(BaseSchema):
    """Standard success schema for offboarding operations."""

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

class SeparationCreate(BaseSchema):
    """Schema to initiate a resignation or separation."""
    
    employee_id: uuid.UUID = Field(
        description="Employee ID of the person being separated.",
        examples=["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]
    )
    exit_type: str = Field(
        default="VOLUNTARY_RESIGNATION",
        description="Type of exit (e.g. VOLUNTARY_RESIGNATION, TERMINATION).",
        examples=["VOLUNTARY_RESIGNATION"]
    )
    separation_mode: str = Field(
        default="ENTERPRISE",
        description="Mode of separation.",
        examples=["ENTERPRISE"]
    )
    resignation_date: date = Field(
        description="Date the resignation was submitted or termination was initiated.",
        examples=["2024-01-15"]
    )
    requested_lwd: date = Field(
        description="Requested Last Working Day.",
        examples=["2024-03-15"]
    )
    contractual_notice_days: int = Field(
        default=60,
        description="Number of notice days required by contract.",
        examples=[60]
    )
    reason: str = Field(
        description="Reason for separation.",
        examples=["Career growth and better opportunities."]
    )

class SeparationRead(AuditReadSchema):
    """Schema for returning separation details."""
    
    tenant_id: uuid.UUID = Field(description="Tenant ID")
    employee_id: uuid.UUID = Field(description="Employee ID")
    exit_type: str = Field(description="Type of exit")
    separation_mode: str = Field(description="Mode of separation")
    resignation_date: date = Field(description="Resignation Date")
    requested_lwd: date = Field(description="Requested Last Working Day")
    approved_lwd: date = Field(description="Approved Last Working Day")
    contractual_notice_days: int = Field(description="Contractual notice days")
    served_notice_days: int = Field(description="Served notice days")
    notice_shortfall_days: int = Field(description="Notice shortfall days")
    notice_shortfall_waived: bool = Field(description="Notice shortfall waived")
    waiver_reason: str | None = Field(description="Waiver reason")
    reason: str = Field(description="Separation reason")
    internal_notes: str | None = Field(description="Internal notes")
    status: str = Field(description="Status of separation")

class SettlementSheetRead(AuditReadSchema):
    """Schema for returning F&F settlement calculations."""
    
    tenant_id: uuid.UUID = Field(description="Tenant ID")
    separation_id: uuid.UUID = Field(description="Separation ID")
    final_working_days: int = Field(description="Final working days in the month")
    pro_rata_salary: Decimal = Field(description="Prorated salary for the final month")
    encashed_leave_days: Decimal = Field(description="Number of leave days eligible for encashment")
    leave_encashment_amount: Decimal = Field(description="Value of encashed leaves")
    is_gratuity_eligible: bool = Field(description="Whether the employee is eligible for gratuity")
    tenure_years: int = Field(description="Completed tenure in years")
    gratuity_amount: Decimal = Field(description="Calculated gratuity payout")
    reimbursements_payable: Decimal = Field(description="Pending reimbursements to pay")
    notice_shortfall_deduction: Decimal = Field(description="Deduction for unserved notice period")
    salary_advance_unrecovered: Decimal = Field(description="Unrecovered salary advance")
    departmental_asset_recoveries: Decimal = Field(description="Asset damage/loss recovery")
    final_tds_tax: Decimal = Field(description="Final TDS tax deduction")
    final_professional_tax: Decimal = Field(description="Final professional tax deduction")
    net_payable_amount: Decimal = Field(description="Net F&F payable amount")
    gl_journal_id: uuid.UUID | None = Field(description="GL Journal ID")
    status: str = Field(description="Status of the settlement")
    audited_by: uuid.UUID | None = Field(description="User ID who audited")
    audited_at: datetime | None = Field(description="Audit timestamp")
    disbursed_at: datetime | None = Field(description="Disbursement timestamp")
    bank_reference_id: str | None = Field(description="Bank reference ID")
