"""Pydantic schemas for PeopleOps Core."""

from datetime import date
import uuid
from typing import Any

from pydantic import ConfigDict, Field

from kernel.core.schemas import AuditReadSchema, BaseSchema


class PartyCreate(BaseSchema):
    """Schema for creating a party record."""
    legal_first_name: str = Field(..., max_length=100, description="Legal first name")
    legal_middle_name: str | None = Field(default=None, max_length=100, description="Legal middle name")
    legal_last_name: str = Field(..., max_length=100, description="Legal last name")
    display_name: str = Field(..., max_length=150, description="Display name")
    date_of_birth: date = Field(..., description="Date of birth")
    gender: str = Field(..., max_length=32, description="Gender")
    personal_email: str = Field(..., max_length=255, description="Personal email")
    mobile_phone: str = Field(..., max_length=32, description="Mobile phone number")


class PartyRead(AuditReadSchema):
    """Schema for reading a party record."""
    legal_first_name: str = Field(description="Legal first name")
    legal_middle_name: str | None = Field(description="Legal middle name")
    legal_last_name: str = Field(description="Legal last name")
    display_name: str = Field(description="Display name")
    date_of_birth: date = Field(description="Date of birth")
    gender: str = Field(description="Gender")
    personal_email: str = Field(description="Personal email")
    mobile_phone: str = Field(description="Mobile phone number")


class EmployeeCreate(BaseSchema):
    """Schema for creating an employee record."""
    party: PartyCreate = Field(description="Party details")
    employee_code: str = Field(..., max_length=32, description="Unique employee code")
    work_email: str = Field(..., max_length=255, description="Work email address")
    legal_entity_id: uuid.UUID = Field(..., description="Legal entity ID")
    department_code: str = Field(..., max_length=64, description="Department code")
    designation_code: str = Field(..., max_length=64, description="Designation code")
    manager_id: uuid.UUID | None = Field(default=None, description="Line manager employee ID")
    location_code: str = Field(default="HQ", max_length=64, description="Location code")
    hire_date: date = Field(..., description="Date of hire")


class EmployeeUpdate(BaseSchema):
    """Schema for updating an employee record."""
    department_code: str | None = Field(default=None, max_length=64, description="Department code")
    designation_code: str | None = Field(default=None, max_length=64, description="Designation code")
    manager_id: uuid.UUID | None = Field(default=None, description="Line manager employee ID")
    location_code: str | None = Field(default=None, max_length=64, description="Location code")
    work_mode: str | None = Field(default=None, max_length=32, description="Work mode")
    status: str | None = Field(default=None, max_length=32, description="Employee status")


class EmployeeRead(AuditReadSchema):
    """Schema for reading an employee record."""
    tenant_id: uuid.UUID = Field(description="Tenant ID")
    party_id: uuid.UUID = Field(description="Party ID")
    employee_code: str = Field(description="Employee code")
    work_email: str = Field(description="Work email address")
    legal_entity_id: uuid.UUID = Field(description="Legal entity ID")
    department_code: str = Field(description="Department code")
    designation_code: str = Field(description="Designation code")
    manager_id: uuid.UUID | None = Field(description="Line manager employee ID")
    location_code: str = Field(description="Location code")
    work_mode: str = Field(description="Work mode")
    status: str = Field(description="Employee status")
    hire_date: date = Field(description="Date of hire")

    # Relationships
    party: PartyRead | None = Field(default=None, description="Associated party details")
    manager: "EmployeeRead | None" = Field(default=None, description="Line manager details")


class CoreBaseResponse(BaseSchema):
    """Standard success schema for core operations."""

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
