"""Pydantic schemas for PeopleOps Payroll."""

import uuid
from typing import Any
from pydantic import ConfigDict, Field
from kernel.core.schemas import BaseSchema
from datetime import date, datetime
from decimal import Decimal


class PayrollBaseResponse(BaseSchema):
    """Standard success schema for payroll operations."""

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

class HRMSPayrollSettingUpdate(BaseSchema):
    """Schema for updating payroll settings."""
    pay_frequency: str | None = Field(default=None, description="Pay frequency.")
    cycle_start_day: int | None = Field(default=None, description="Cycle start day.")
    payout_day: str | None = Field(default=None, description="Payout day.")
    lop_calculation_method: str | None = Field(default=None, description="LOP calculation method.")
    enable_epf: bool | None = Field(default=None, description="Enable EPF.")
    epf_calculation_mode: str | None = Field(default=None, description="EPF calculation mode.")
    epf_establishment_code: str | None = Field(default=None, description="EPF establishment code.")
    enable_esic: bool | None = Field(default=None, description="Enable ESIC.")
    esic_establishment_code: str | None = Field(default=None, description="ESIC establishment code.")
    enable_professional_tax: bool | None = Field(default=None, description="Enable Professional Tax.")
    enable_lwf: bool | None = Field(default=None, description="Enable LWF.")
    enable_gratuity: bool | None = Field(default=None, description="Enable Gratuity.")
    default_tax_regime: str | None = Field(default=None, description="Default tax regime.")
    allow_midyear_regime_switch: bool | None = Field(default=None, description="Allow midyear regime switch.")
    tax_declaration_window_end_day: int | None = Field(default=None, description="Tax declaration window end day.")
    auto_dispatch_payslip_emails: bool | None = Field(default=None, description="Auto dispatch payslip emails.")
    payslip_password_formula: str | None = Field(default=None, description="Payslip password formula.")

class HRMSPayrollRunCreate(BaseSchema):
    """Schema for creating a payroll run."""
    period_start: date = Field(..., description="Period start date.")
    period_end: date = Field(..., description="Period end date.")
    stage: str = Field(default="DRAFT", description="Run stage.")

