"""Business logic service for PeopleOps Core."""

import logging
import uuid
from typing import Any
from collections.abc import Sequence

from sqlalchemy import select, String, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.services.base import BaseService
from kernel.core.services.errors import NotFoundError
from peopleops.models import HRMSEmployee, HRMSParty
from peopleops.core.schemas import EmployeeCreate, EmployeeUpdate

logger = logging.getLogger(__name__)


class EmployeeService(BaseService[HRMSEmployee]):
    """Service layer executing business rules for core employees."""
    model = HRMSEmployee

    def base_query(self, include_deleted: bool = False):
        stmt = super().base_query(include_deleted).options(
            selectinload(HRMSEmployee.party),
            selectinload(HRMSEmployee.manager).selectinload(HRMSEmployee.party),
        )
        return stmt

    async def list_employees(
        self,
        tenant_id: uuid.UUID,
        department: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[Sequence[HRMSEmployee], int]:
        """List employees for a tenant with optional filtering."""
        stmt = self.base_query().where(HRMSEmployee.tenant_id == tenant_id)

        if department:
            stmt = stmt.where(HRMSEmployee.department_code == department)

        if search:
            search_term = f"%{search}%"
            stmt = stmt.join(HRMSParty).where(
                or_(
                    HRMSEmployee.employee_code.ilike(search_term),
                    HRMSEmployee.work_email.ilike(search_term),
                    HRMSParty.legal_first_name.ilike(search_term),
                    HRMSParty.legal_last_name.ilike(search_term),
                    HRMSParty.display_name.ilike(search_term),
                )
            )

        total = (
            await self.session.execute(select(func.count()).select_from(stmt.subquery()))
        ).scalar_one()

        rows = await self.session.execute(
            stmt.order_by(HRMSEmployee.created_at.desc()).offset(offset).limit(limit)
        )
        return rows.scalars().all(), total

    async def create_employee(
        self,
        tenant_id: uuid.UUID,
        data: EmployeeCreate,
        actor_id: uuid.UUID | None = None,
    ) -> HRMSEmployee:
        """Create a new party and employee record."""
        # Create party first
        party = HRMSParty(
            tenant_id=tenant_id,
            legal_first_name=data.party.legal_first_name,
            legal_middle_name=data.party.legal_middle_name,
            legal_last_name=data.party.legal_last_name,
            display_name=data.party.display_name,
            date_of_birth=data.party.date_of_birth,
            gender=data.party.gender,
            personal_email=data.party.personal_email,
            mobile_phone=data.party.mobile_phone,
            created_by=actor_id,
            updated_by=actor_id,
        )
        self.session.add(party)
        await self.session.flush()

        # Create employee
        employee = HRMSEmployee(
            tenant_id=tenant_id,
            party_id=party.id,
            employee_code=data.employee_code,
            work_email=data.work_email,
            legal_entity_id=data.legal_entity_id,
            department_code=data.department_code,
            designation_code=data.designation_code,
            manager_id=data.manager_id,
            location_code=data.location_code,
            hire_date=data.hire_date,
            created_by=actor_id,
            updated_by=actor_id,
        )
        self.session.add(employee)
        await self.session.flush()
        
        # reload to get relationships
        stmt = self.base_query().where(HRMSEmployee.id == employee.id)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_employee_profile(
        self,
        tenant_id: uuid.UUID,
        employee_id: uuid.UUID,
    ) -> HRMSEmployee:
        """Get full employee profile."""
        stmt = self.base_query().where(
            HRMSEmployee.tenant_id == tenant_id,
            HRMSEmployee.id == employee_id
        )
        result = await self.session.execute(stmt)
        employee = result.scalar_one_or_none()
        
        if not employee:
            raise NotFoundError("Employee not found")
            
        return employee
        
    async def update_employee(
        self,
        tenant_id: uuid.UUID,
        employee_id: uuid.UUID,
        data: EmployeeUpdate,
        actor_id: uuid.UUID | None = None,
    ) -> HRMSEmployee:
        """Update operational metadata for an employee."""
        employee = await self.get_employee_profile(tenant_id, employee_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(employee, key, value)
            
        employee.updated_by = actor_id
        await self.session.flush()
        
        return employee


class CoreService:
    """Service layer executing business rules for core."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for core."""
        return {"submodule": "core", "ready": True}


service = CoreService()
