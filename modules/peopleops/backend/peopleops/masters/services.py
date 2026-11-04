"""Business logic service for PeopleOps Masters."""

import logging
from typing import Any
import uuid

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from kernel.core.services import BaseService, NotFoundError, ConflictError
from kernel.auth.dependencies import SecurityContext

from peopleops.models import (
    HRMSDepartment,
    HRMSDesignation,
    HRMSLocation,
    HRMSHolidayCalendar,
    HRMSHoliday,
    HRMSPicklist
)
from .schemas import (
    DepartmentCreate, DepartmentUpdate,
    DesignationCreate, DesignationUpdate,
    LocationCreate, LocationUpdate,
    HolidayCalendarCreate, HolidayCalendarUpdate,
    HolidayCreate, HolidayUpdate,
    PicklistCreate, PicklistUpdate
)

logger = logging.getLogger(__name__)


class DepartmentService(BaseService[HRMSDepartment]):
    model = HRMSDepartment

class DesignationService(BaseService[HRMSDesignation]):
    model = HRMSDesignation

class LocationService(BaseService[HRMSLocation]):
    model = HRMSLocation

class HolidayCalendarService(BaseService[HRMSHolidayCalendar]):
    model = HRMSHolidayCalendar

class HolidayService(BaseService[HRMSHoliday]):
    model = HRMSHoliday

class PicklistService(BaseService[HRMSPicklist]):
    model = HRMSPicklist


class MastersService:
    """Service layer executing business rules for masters."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for masters."""
        return {"submodule": "masters", "ready": True}

    async def reseed_defaults(self, session: AsyncSession, tenant_id: uuid.UUID, actor_id: uuid.UUID) -> dict[str, Any]:
        """Idempotently seed default master data for the tenant."""

        # Departments
        departments = [
            {"code": "ENG", "name": "Engineering & Technology"},
            {"code": "PROD", "name": "Product Management"},
            {"code": "DESIGN", "name": "Design & Creative"},
            {"code": "SALES", "name": "Sales & Business Development"},
            {"code": "MARKETING", "name": "Growth & Marketing"},
            {"code": "PEOPLEOPS", "name": "People Operations & HR"},
            {"code": "FINANCE", "name": "Finance & Legal"},
            {"code": "OPERATIONS", "name": "General Operations"}
        ]
        
        for dept in departments:
            stmt = insert(HRMSDepartment).values(
                tenant_id=tenant_id,
                code=dept["code"],
                name=dept["name"],
                is_system=True,
                is_active=True
            ).on_conflict_do_update(
                index_elements=["tenant_id", "code"],
                set_={"is_active": True},
                where=(HRMSDepartment.is_system == True)
            )
            await session.execute(stmt)

        # Designations
        designations = [
            {"code": "SOFTWARE_ENGINEER", "name": "Software Engineer", "job_family": "ENGINEERING"},
            {"code": "STAFF_ENG", "name": "Staff Engineer", "job_family": "ENGINEERING"},
            {"code": "PRODUCT_MANAGER", "name": "Product Manager", "job_family": "PRODUCT"}
        ]
        
        for desig in designations:
            stmt = insert(HRMSDesignation).values(
                tenant_id=tenant_id,
                code=desig["code"],
                name=desig["name"],
                job_family=desig["job_family"],
                is_system=True,
                is_active=True
            ).on_conflict_do_update(
                index_elements=["tenant_id", "code"],
                set_={"is_active": True},
                where=(HRMSDesignation.is_system == True)
            )
            await session.execute(stmt)

        # Picklists
        picklists = [
            {"category": "DOCUMENT_TYPE", "code": "DOC_AADHAAR", "name": "Aadhaar Card", "display_order": 1},
            {"category": "DOCUMENT_TYPE", "code": "DOC_PAN", "name": "PAN Card", "display_order": 2},
            {"category": "FAMILY_RELATIONSHIP", "code": "REL_SPOUSE", "name": "Spouse", "display_order": 1},
            {"category": "EMPLOYMENT_TYPE", "code": "PERMANENT_FULL_TIME", "name": "Permanent Full-Time", "display_order": 1},
        ]
        
        for pick in picklists:
            stmt = insert(HRMSPicklist).values(
                tenant_id=tenant_id,
                category=pick["category"],
                code=pick["code"],
                name=pick["name"],
                display_order=pick["display_order"],
                is_system=True,
                is_active=True
            ).on_conflict_do_update(
                index_elements=["tenant_id", "category", "code"],
                set_={"is_active": True},
                where=(HRMSPicklist.is_system == True)
            )
            await session.execute(stmt)
            
        await session.flush()
        return {"status": "ok", "message": "Tenant masters reseeded successfully"}


service = MastersService()
