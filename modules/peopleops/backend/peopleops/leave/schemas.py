"""Pydantic schemas for PeopleOps Leave."""

from datetime import date
from decimal import Decimal
from typing import Any
import uuid

from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema, Page


class LeaveTypeRead(AuditReadSchema):
    """Read representation of a leave policy type."""

    code: str = Field(description="Unique code for the leave type.", examples=["PL"])
    name: str = Field(description="Human-readable name of the leave type.", examples=["Privilege Leave"])
    description: str | None = Field(default=None, description="Detailed description of the policy.", examples=["Annual paid time off."])
    color_hex: str = Field(description="Hex colour code for UI display.", examples=["#3B82F6"])
    is_active: bool = Field(description="Whether the leave type is currently active.", examples=[True])
    is_system: bool = Field(description="Whether this is a system-managed leave type.", examples=[False])
    is_unlimited: bool = Field(description="Whether this leave type offers unlimited PTO.", examples=[False])
    annual_quota: Decimal = Field(description="Total annual accrual quota.", examples=[Decimal("12.00")])
    accrual_frequency: str = Field(description="Frequency of accrual.", examples=["ANNUAL_LUMP_SUM"])
    accrual_timing: str = Field(description="When accrual happens during the period.", examples=["BEGINNING_OF_PERIOD"])
    proration_rule: str = Field(description="Rule for prorating balance for mid-year joiners.", examples=["EXACT_DAYS"])
    can_carry_forward: bool = Field(description="Whether unused balance can be carried forward.", examples=[False])
    carry_forward_cap: Decimal = Field(description="Maximum days that can be carried forward.", examples=[Decimal("0.00")])
    carry_forward_expiry_months: int | None = Field(default=None, description="Months after which carried forward leaves expire.", examples=[None])
    is_encashable: bool = Field(description="Whether unused leave can be encashed.", examples=[False])
    encashment_mode: str = Field(description="When encashment is allowed.", examples=["UPON_SEPARATION_ONLY"])
    encashment_salary_basis: str = Field(description="Salary basis used for encashment calculation.", examples=["BASIC_SALARY"])
    encashment_min_balance_retained: Decimal = Field(description="Minimum balance to retain during encashment.", examples=[Decimal("0.00")])
    encashment_max_days_per_year: Decimal = Field(description="Maximum days that can be encashed per year.", examples=[Decimal("0.00")])
    allow_half_day: bool = Field(description="Whether half-day applications are allowed.", examples=[True])
    min_notice_days: int = Field(description="Minimum notice days required before applying.", examples=[0])
    max_consecutive_days: int | None = Field(default=None, description="Maximum consecutive days that can be applied.", examples=[10])
    allow_past_dating: bool = Field(description="Whether leaves can be applied for past dates.", examples=[True])
    max_past_days: int = Field(description="Maximum past days allowed for application.", examples=[3])
    allow_negative_balance: bool = Field(description="Whether negative balances are allowed.", examples=[False])
    max_negative_days: Decimal = Field(description="Maximum allowed negative balance.", examples=[Decimal("0.00")])
    requires_attachment: bool = Field(description="Whether an attachment is required (e.g., medical certificate).", examples=[False])
    attachment_mandatory_above_days: int | None = Field(default=None, description="Days above which attachment is mandatory.", examples=[3])
    include_weekends: bool = Field(description="Whether weekends are counted as leave days.", examples=[False])
    include_holidays: bool = Field(description="Whether public holidays are counted as leave days.", examples=[False])
    sandwich_rule_mode: str = Field(description="Sandwich rule configuration.", examples=["DISABLED"])
    probation_rule: str = Field(description="Leave rule during probation.", examples=["FULL_ACCESS"])
    notice_period_rule: str = Field(description="Leave rule during notice period.", examples=["MANAGER_DISCRETION"])
    applicable_gender: str = Field(description="Gender applicability.", examples=["ALL"])
    applicable_employment_types: list[str] | None = Field(default=None, description="Applicable employment contract types.", examples=[["PERMANENT_FULL_TIME"]])
    approval_workflow: str = Field(description="Approval workflow configuration.", examples=["SINGLE_LEVEL_MANAGER"])
    auto_approve_if_below_days: Decimal | None = Field(default=None, description="Auto-approve requests below this duration.", examples=[None])
    sla_hours: int = Field(description="SLA in hours for manager approval before escalation.", examples=[48])
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "code": "PL",
                    "name": "Privilege Leave",
                    "description": "Annual paid time off.",
                    "color_hex": "#3B82F6",
                    "is_active": True,
                    "is_system": False,
                    "is_unlimited": False,
                    "annual_quota": "12.00",
                    "accrual_frequency": "ANNUAL_LUMP_SUM",
                    "accrual_timing": "BEGINNING_OF_PERIOD",
                    "proration_rule": "EXACT_DAYS",
                    "can_carry_forward": False,
                    "carry_forward_cap": "0.00",
                    "carry_forward_expiry_months": None,
                    "is_encashable": False,
                    "encashment_mode": "UPON_SEPARATION_ONLY",
                    "encashment_salary_basis": "BASIC_SALARY",
                    "encashment_min_balance_retained": "0.00",
                    "encashment_max_days_per_year": "0.00",
                    "allow_half_day": True,
                    "min_notice_days": 0,
                    "max_consecutive_days": 10,
                    "allow_past_dating": True,
                    "max_past_days": 3,
                    "allow_negative_balance": False,
                    "max_negative_days": "0.00",
                    "requires_attachment": False,
                    "attachment_mandatory_above_days": 3,
                    "include_weekends": False,
                    "include_holidays": False,
                    "sandwich_rule_mode": "DISABLED",
                    "probation_rule": "FULL_ACCESS",
                    "notice_period_rule": "MANAGER_DISCRETION",
                    "applicable_gender": "ALL",
                    "applicable_employment_types": ["PERMANENT_FULL_TIME"],
                    "approval_workflow": "SINGLE_LEVEL_MANAGER",
                    "auto_approve_if_below_days": None,
                    "sla_hours": 48,
                    "created_at": "2026-10-29T10:00:00Z",
                    "created_by": "11111111-1111-1111-1111-111111111111",
                    "updated_at": "2026-10-29T10:15:00Z",
                    "updated_by": "11111111-1111-1111-1111-111111111111",
                    "deleted_at": None,
                    "deleted_by": None
                }
            ]
        }
    )


class LeaveBalanceRead(BaseSchema):
    """Real-time calculated leave balance."""
    
    leave_type_id: uuid.UUID = Field(description="Leave type identifier.", examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"])
    leave_type_code: str = Field(description="Leave type code.", examples=["PL"])
    leave_type_name: str = Field(description="Leave type name.", examples=["Privilege Leave"])
    accrued_days: Decimal = Field(description="Total accrued days historically.", examples=[Decimal("12.00")])
    consumed_days: Decimal = Field(description="Total days actually consumed.", examples=[Decimal("2.00")])
    pending_days: Decimal = Field(description="Days currently locked in pending applications.", examples=[Decimal("1.00")])
    available_balance: Decimal = Field(description="Current available balance (accrued - consumed - pending).", examples=[Decimal("9.00")])

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "leave_type_id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "leave_type_code": "PL",
                    "leave_type_name": "Privilege Leave",
                    "accrued_days": "12.00",
                    "consumed_days": "2.00",
                    "pending_days": "1.00",
                    "available_balance": "9.00"
                }
            ]
        }
    )

class LeaveApplicationCreate(BaseSchema):
    """Payload for submitting a new leave application."""

    leave_type_id: uuid.UUID = Field(description="Identifier of the leave type.", examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"])
    start_date: date = Field(description="Leave start date.", examples=["2026-12-24"])
    start_half: str = Field(default="FULL_DAY", description="Half specification for start date.", examples=["FULL_DAY"])
    end_date: date = Field(description="Leave end date.", examples=["2026-12-25"])
    end_half: str = Field(default="FULL_DAY", description="Half specification for end date.", examples=["FULL_DAY"])
    reason: str = Field(min_length=1, max_length=1000, description="Reason for leave.", examples=["Christmas break."])
    supporting_document_id: uuid.UUID | None = Field(default=None, description="Optional supporting document ID.", examples=[None])


class LeaveApplicationRead(AuditReadSchema):
    """Read representation of a leave application."""

    employee_id: uuid.UUID = Field(description="Identifier of the applying employee.", examples=["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"])
    leave_type_id: uuid.UUID = Field(description="Identifier of the leave type.", examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"])
    start_date: date = Field(description="Leave start date.", examples=["2026-12-24"])
    start_half: str = Field(description="Half specification for start date.", examples=["FULL_DAY"])
    end_date: date = Field(description="Leave end date.", examples=["2026-12-25"])
    end_half: str = Field(description="Half specification for end date.", examples=["FULL_DAY"])
    base_days: Decimal = Field(description="Number of requested leave days before rules.", examples=[Decimal("2.00")])
    sandwich_days: Decimal = Field(description="Additional days deducted due to sandwich rules.", examples=[Decimal("0.00")])
    total_days: Decimal = Field(description="Total days deducted from balance.", examples=[Decimal("2.00")])
    status: str = Field(description="Current status of the application.", examples=["PENDING"])
    reason: str = Field(description="Reason for leave.", examples=["Christmas break."])
    supporting_document_id: uuid.UUID | None = Field(default=None, description="Optional supporting document ID.", examples=[None])
    manager_id: uuid.UUID | None = Field(default=None, description="Reporting manager ID at time of application.", examples=["b1ffcd88-8d0c-3fe7-aa5c-5aa8ac270b22"])
    approved_by: uuid.UUID | None = Field(default=None, description="User who approved the leave.", examples=[None])
    approved_at: date | None = Field(default=None, description="When the leave was approved.", examples=[None])
    rejection_reason: str | None = Field(default=None, description="Reason provided if rejected.", examples=[None])

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "employee_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                    "leave_type_id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "start_date": "2026-12-24",
                    "start_half": "FULL_DAY",
                    "end_date": "2026-12-25",
                    "end_half": "FULL_DAY",
                    "base_days": "2.00",
                    "sandwich_days": "0.00",
                    "total_days": "2.00",
                    "status": "PENDING",
                    "reason": "Christmas break.",
                    "supporting_document_id": None,
                    "manager_id": "b1ffcd88-8d0c-3fe7-aa5c-5aa8ac270b22",
                    "approved_by": None,
                    "approved_at": None,
                    "rejection_reason": None,
                    "created_at": "2026-10-29T10:00:00Z",
                    "created_by": "11111111-1111-1111-1111-111111111111",
                    "updated_at": "2026-10-29T10:15:00Z",
                    "updated_by": "11111111-1111-1111-1111-111111111111",
                    "deleted_at": None,
                    "deleted_by": None
                }
            ]
        }
    )

class LeaveLedgerRead(AuditReadSchema):
    """Immutable double-entry ledger transaction."""

    employee_id: uuid.UUID = Field(description="Employee identifier.", examples=["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"])
    leave_type_id: uuid.UUID = Field(description="Leave type identifier.", examples=["3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f"])
    transaction_date: date = Field(description="Date the transaction occurred.", examples=["2026-12-24"])
    action: str = Field(description="Ledger action code (e.g. ACCRUED, CONSUMED).", examples=["CONSUMED"])
    days: Decimal = Field(description="Transaction quantity.", examples=[Decimal("-2.00")])
    reference_id: uuid.UUID | None = Field(default=None, description="Optional reference to application or event.", examples=["c2aebc99-9c0b-4ef8-bb6d-6bb9bd380c33"])
    expires_at: date | None = Field(default=None, description="Optional expiry date for accrued days.", examples=[None])
    remarks: str = Field(description="Audit trail remarks.", examples=["Deducted for approved leave application."])
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "employee_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                    "leave_type_id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                    "transaction_date": "2026-12-24",
                    "action": "CONSUMED",
                    "days": "-2.00",
                    "reference_id": "c2aebc99-9c0b-4ef8-bb6d-6bb9bd380c33",
                    "expires_at": None,
                    "remarks": "Deducted for approved leave application.",
                    "created_at": "2026-10-29T10:00:00Z",
                    "created_by": "11111111-1111-1111-1111-111111111111",
                    "updated_at": "2026-10-29T10:15:00Z",
                    "updated_by": "11111111-1111-1111-1111-111111111111",
                    "deleted_at": None,
                    "deleted_by": None
                }
            ]
        }
    )


class LeaveBaseResponse(BaseSchema):
    """Standard success schema for leave operations."""

    status: str = Field(default="ok", description="Operation status string.", examples=["ok"])
    message: str = Field(default="Operation completed successfully.", description="Status narrative.", examples=["Operation completed successfully."])
    data: dict[str, Any] = Field(default_factory=dict, description="Payload data mapping.", examples=[{}])
    
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

class LeaveActionRequest(BaseSchema):
    """Payload for approving or rejecting a leave application."""

    reason: str | None = Field(default=None, max_length=1000, description="Optional reason for approval/rejection.", examples=["Approved, have a good trip."])

