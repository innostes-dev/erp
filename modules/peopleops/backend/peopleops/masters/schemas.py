"""Pydantic schemas for PeopleOps Masters."""

from decimal import Decimal
from typing import Any
import uuid
from pydantic import ConfigDict, Field
from kernel.core.schemas import AuditReadSchema, BaseSchema, Page
from datetime import date


class MastersBaseResponse(BaseSchema):
    """Standard success schema for masters operations."""

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

class DepartmentCreate(BaseSchema):
    code: str = Field(min_length=1, max_length=64, description="Machine code for the department.")
    name: str = Field(min_length=1, max_length=255, description="Human readable name of the department.")
    parent_id: uuid.UUID | None = Field(default=None, description="Optional parent department ID.")
    manager_id: uuid.UUID | None = Field(default=None, description="Optional manager employee ID.")
    cost_center_code: str | None = Field(default=None, max_length=64, description="Optional cost center code.")
    is_active: bool = Field(default=True, description="Whether the department is active.")

class DepartmentUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Human readable name of the department.")
    parent_id: uuid.UUID | None = Field(default=None, description="Optional parent department ID.")
    manager_id: uuid.UUID | None = Field(default=None, description="Optional manager employee ID.")
    cost_center_code: str | None = Field(default=None, max_length=64, description="Optional cost center code.")
    is_active: bool | None = Field(default=None, description="Whether the department is active.")

class DepartmentRead(AuditReadSchema):
    code: str = Field(description="Machine code for the department.")
    name: str = Field(description="Human readable name of the department.")
    parent_id: uuid.UUID | None = Field(default=None, description="Optional parent department ID.")
    manager_id: uuid.UUID | None = Field(default=None, description="Optional manager employee ID.")
    cost_center_code: str | None = Field(default=None, description="Optional cost center code.")
    is_active: bool = Field(description="Whether the department is active.")
    is_system: bool = Field(description="Whether the department is a system default.")

class DepartmentPage(Page[DepartmentRead]):
    """Paginated collection for departments."""

class DesignationCreate(BaseSchema):
    code: str = Field(min_length=1, max_length=64, description="Machine code for the designation.")
    name: str = Field(min_length=1, max_length=255, description="Human readable name of the designation.")
    job_family: str | None = Field(default=None, max_length=64, description="Optional grouping family.")
    description: str | None = Field(default=None, description="Detailed description.")
    is_active: bool = Field(default=True, description="Whether the designation is active.")

class DesignationUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Human readable name.")
    job_family: str | None = Field(default=None, max_length=64, description="Optional grouping family.")
    description: str | None = Field(default=None, description="Detailed description.")
    is_active: bool | None = Field(default=None, description="Whether the designation is active.")

class DesignationRead(AuditReadSchema):
    code: str = Field(description="Machine code.")
    name: str = Field(description="Human readable name.")
    job_family: str | None = Field(default=None, description="Grouping family.")
    description: str | None = Field(default=None, description="Detailed description.")
    is_active: bool = Field(description="Whether the designation is active.")
    is_system: bool = Field(description="Whether the designation is a system default.")

class DesignationPage(Page[DesignationRead]):
    """Paginated collection for designations."""

class LocationCreate(BaseSchema):
    code: str = Field(min_length=1, max_length=64, description="Location code.")
    name: str = Field(min_length=1, max_length=255, description="Location name.")
    physical_address: str = Field(min_length=1, description="Physical address.")
    city: str = Field(min_length=1, max_length=100, description="City.")
    state: str = Field(min_length=1, max_length=100, description="State.")
    country_code: str = Field(default="IN", min_length=2, max_length=2, description="Country code.")
    timezone: str = Field(default="Asia/Kolkata", max_length=64, description="Timezone.")
    latitude: Decimal | None = Field(default=None, description="Latitude.")
    longitude: Decimal | None = Field(default=None, description="Longitude.")
    geofence_radius_meters: int = Field(default=200, ge=0, description="Geofence radius.")
    ip_whitelist_cidrs: list[str] | None = Field(default=None, description="IP whitelist.")
    is_active: bool = Field(default=True, description="Whether the location is active.")

class LocationUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Location name.")
    physical_address: str | None = Field(default=None, min_length=1, description="Physical address.")
    city: str | None = Field(default=None, min_length=1, max_length=100, description="City.")
    state: str | None = Field(default=None, min_length=1, max_length=100, description="State.")
    country_code: str | None = Field(default=None, min_length=2, max_length=2, description="Country code.")
    timezone: str | None = Field(default=None, max_length=64, description="Timezone.")
    latitude: Decimal | None = Field(default=None, description="Latitude.")
    longitude: Decimal | None = Field(default=None, description="Longitude.")
    geofence_radius_meters: int | None = Field(default=None, ge=0, description="Geofence radius.")
    ip_whitelist_cidrs: list[str] | None = Field(default=None, description="IP whitelist.")
    is_active: bool | None = Field(default=None, description="Whether the location is active.")

class LocationRead(AuditReadSchema):
    code: str = Field(description="Location code.")
    name: str = Field(description="Location name.")
    physical_address: str = Field(description="Physical address.")
    city: str = Field(description="City.")
    state: str = Field(description="State.")
    country_code: str = Field(description="Country code.")
    timezone: str = Field(description="Timezone.")
    latitude: Decimal | None = Field(default=None, description="Latitude.")
    longitude: Decimal | None = Field(default=None, description="Longitude.")
    geofence_radius_meters: int = Field(description="Geofence radius.")
    ip_whitelist_cidrs: list[str] | None = Field(default=None, description="IP whitelist.")
    is_active: bool = Field(description="Whether the location is active.")
    is_system: bool = Field(description="Whether the location is a system default.")

class LocationPage(Page[LocationRead]):
    """Paginated collection for locations."""

class HolidayCalendarCreate(BaseSchema):
    code: str = Field(min_length=1, max_length=64, description="Calendar code.")
    name: str = Field(min_length=1, max_length=255, description="Calendar name.")
    calendar_year: int = Field(description="Year of the calendar.")
    location_id: uuid.UUID | None = Field(default=None, description="Optional location ID.")
    is_default: bool = Field(default=False, description="Is this the default calendar.")
    is_active: bool = Field(default=True, description="Whether the calendar is active.")

class HolidayCalendarUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Calendar name.")
    is_default: bool | None = Field(default=None, description="Is this the default calendar.")
    is_active: bool | None = Field(default=None, description="Whether the calendar is active.")

class HolidayCalendarRead(AuditReadSchema):
    code: str = Field(description="Calendar code.")
    name: str = Field(description="Calendar name.")
    calendar_year: int = Field(description="Year of the calendar.")
    location_id: uuid.UUID | None = Field(default=None, description="Optional location ID.")
    is_default: bool = Field(description="Is this the default calendar.")
    is_active: bool = Field(description="Whether the calendar is active.")

class HolidayCalendarPage(Page[HolidayCalendarRead]):
    """Paginated collection for holiday calendars."""

class HolidayCreate(BaseSchema):
    calendar_id: uuid.UUID = Field(description="Calendar ID.")
    name: str = Field(min_length=1, max_length=150, description="Holiday name.")
    holiday_date: date = Field(description="Holiday date.")
    holiday_type: str = Field(default="MANDATORY", max_length=32, description="Type of holiday.")
    is_half_day: bool = Field(default=False, description="Is it a half day.")
    half_day_period: str | None = Field(default="FULL_DAY", max_length=16, description="Half day period.")
    description: str | None = Field(default=None, description="Optional description.")
    observed_substitute_date: date | None = Field(default=None, description="Substitute date.")

class HolidayUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=150, description="Holiday name.")
    holiday_type: str | None = Field(default=None, max_length=32, description="Type of holiday.")
    is_half_day: bool | None = Field(default=None, description="Is it a half day.")
    half_day_period: str | None = Field(default=None, max_length=16, description="Half day period.")
    description: str | None = Field(default=None, description="Optional description.")
    observed_substitute_date: date | None = Field(default=None, description="Substitute date.")

class HolidayRead(AuditReadSchema):
    calendar_id: uuid.UUID = Field(description="Calendar ID.")
    name: str = Field(description="Holiday name.")
    holiday_date: date = Field(description="Holiday date.")
    holiday_type: str = Field(description="Type of holiday.")
    is_half_day: bool = Field(description="Is it a half day.")
    half_day_period: str | None = Field(default=None, description="Half day period.")
    description: str | None = Field(default=None, description="Optional description.")
    observed_substitute_date: date | None = Field(default=None, description="Substitute date.")

class HolidayPage(Page[HolidayRead]):
    """Paginated collection for holidays."""

class PicklistCreate(BaseSchema):
    category: str = Field(min_length=1, max_length=64, description="Picklist category.")
    code: str = Field(min_length=1, max_length=64, description="Picklist code.")
    name: str = Field(min_length=1, max_length=255, description="Human readable name.")
    display_order: int = Field(default=0, description="Display order.")
    is_active: bool = Field(default=True, description="Whether the picklist is active.")

class PicklistUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Human readable name.")
    display_order: int | None = Field(default=None, description="Display order.")
    is_active: bool | None = Field(default=None, description="Whether the picklist is active.")

class PicklistRead(AuditReadSchema):
    category: str = Field(description="Picklist category.")
    code: str = Field(description="Picklist code.")
    name: str = Field(description="Human readable name.")
    display_order: int = Field(description="Display order.")
    is_active: bool = Field(description="Whether the picklist is active.")
    is_system: bool = Field(description="Whether the picklist is a system default.")

class PicklistPage(Page[PicklistRead]):
    """Paginated collection for picklists."""
