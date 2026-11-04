"""Business logic service for PeopleOps Offboarding."""

import logging
import uuid
from typing import Any
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from kernel.core.services.errors import NotFoundError, ConflictError
from peopleops.offboarding.schemas import SeparationCreate, SeparationRead, SettlementSheetRead
from peopleops.models import HRMSSeparation, HRMSSettlementSheet

logger = logging.getLogger(__name__)


class OffboardingService:
    """Service layer executing business rules for offboarding."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for offboarding."""
        return {"submodule": "offboarding", "ready": True}
        
    async def list_separations(self, session: AsyncSession) -> list[SeparationRead]:
        """Retrieve all separation records."""
        result = await session.execute(select(HRMSSeparation))
        separations = result.scalars().all()
        return [SeparationRead.model_validate(sep) for sep in separations]

    async def initiate_separation(self, session: AsyncSession, payload: SeparationCreate) -> SeparationRead:
        """Create a new HRMSSeparation."""
        # Simple math to figure out approved lwd
        approved_lwd = payload.requested_lwd
        
        model = HRMSSeparation(
            tenant_id=uuid.uuid4(),  # Mocking tenant injection for now
            employee_id=payload.employee_id,
            exit_type=payload.exit_type,
            separation_mode=payload.separation_mode,
            resignation_date=payload.resignation_date,
            requested_lwd=payload.requested_lwd,
            approved_lwd=approved_lwd,
            contractual_notice_days=payload.contractual_notice_days,
            served_notice_days=payload.contractual_notice_days,
            notice_shortfall_days=0,
            notice_shortfall_waived=False,
            waiver_reason=None,
            reason=payload.reason,
            internal_notes=None,
            status="INITIATED",
            created_by=uuid.uuid4(),  # Mocking user ID
        )
        
        session.add(model)
        await session.flush()
        
        return SeparationRead.model_validate(model)

    def calculate_gratuity(self, basic_salary: Decimal, tenure_years: int) -> Decimal:
        """Calculate Gratuity based on Payment of Gratuity Act 1972 formula:
        (15 * Last_Basic * Years) / 26
        """
        if tenure_years < 5:
            return Decimal("0.00")
            
        gratuity = (Decimal("15") * basic_salary * Decimal(tenure_years)) / Decimal("26")
        return gratuity.quantize(Decimal("0.00"))

    def calculate_leave_encashment(self, basic_salary: Decimal, encashable_leaves: Decimal) -> Decimal:
        """Calculate Leave Encashment: Days * (Basic / 26)"""
        encashment = encashable_leaves * (basic_salary / Decimal("26"))
        return encashment.quantize(Decimal("0.00"))
        
    def calculate_notice_shortfall_recovery(self, basic_salary: Decimal, shortfall_days: int) -> Decimal:
        """Calculate Notice Shortfall Recovery: Days * (Basic / 26)"""
        if shortfall_days <= 0:
            return Decimal("0.00")
            
        recovery = Decimal(shortfall_days) * (basic_salary / Decimal("26"))
        return recovery.quantize(Decimal("0.00"))

    async def calculate_settlement(self, session: AsyncSession, separation_id: uuid.UUID) -> SettlementSheetRead:
        """Calculate and retrieve F&F settlement sheet."""
        result = await session.execute(
            select(HRMSSeparation).where(HRMSSeparation.id == separation_id)
        )
        separation = result.scalars().first()
        
        if not separation:
            raise NotFoundError(f"Separation {separation_id} not found")

        # For demonstration, we supply constants instead of pulling from employee details.
        # A full solution would query HRMSEmployee and other ledgers.
        basic_salary = Decimal("60000.00")
        tenure_years = 6
        encashable_leaves = Decimal("10.5")
        shortfall_days = separation.notice_shortfall_days
        
        gratuity = self.calculate_gratuity(basic_salary, tenure_years)
        leave_encashment = self.calculate_leave_encashment(basic_salary, encashable_leaves)
        notice_recovery = self.calculate_notice_shortfall_recovery(basic_salary, shortfall_days)
        
        prorated_salary = Decimal("15000.00")
        asset_recoveries = Decimal("0.00")
        reimbursements = Decimal("0.00")
        tds_tax = Decimal("2000.00")
        prof_tax = Decimal("200.00")
        salary_advance = Decimal("0.00")
        
        earnings = prorated_salary + leave_encashment + gratuity + reimbursements
        deductions = notice_recovery + asset_recoveries + tds_tax + prof_tax + salary_advance
        net_payable = earnings - deductions
        
        # Upsert logic (if it exists, return it; else create)
        settlement_result = await session.execute(
            select(HRMSSettlementSheet).where(HRMSSettlementSheet.separation_id == separation_id)
        )
        model = settlement_result.scalars().first()
        
        if not model:
            model = HRMSSettlementSheet(
                tenant_id=separation.tenant_id,
                separation_id=separation_id,
                final_working_days=10,
                pro_rata_salary=prorated_salary,
                encashed_leave_days=encashable_leaves,
                leave_encashment_amount=leave_encashment,
                is_gratuity_eligible=tenure_years >= 5,
                tenure_years=tenure_years,
                gratuity_amount=gratuity,
                reimbursements_payable=reimbursements,
                notice_shortfall_deduction=notice_recovery,
                salary_advance_unrecovered=salary_advance,
                departmental_asset_recoveries=asset_recoveries,
                final_tds_tax=tds_tax,
                final_professional_tax=prof_tax,
                net_payable_amount=net_payable,
                status="DRAFT"
            )
            session.add(model)
            await session.flush()
            
        return SettlementSheetRead.model_validate(model)

    async def disburse_settlement(self, session: AsyncSession, separation_id: uuid.UUID) -> dict[str, Any]:
        """Mark F&F settlement as disbursed."""
        result = await session.execute(
            select(HRMSSettlementSheet).where(HRMSSettlementSheet.separation_id == separation_id)
        )
        model = result.scalars().first()
        if not model:
            raise NotFoundError("Settlement sheet not found")
            
        model.status = "DISBURSED"
        model.disbursed_at = datetime.utcnow()
        await session.flush()
        
        return {"status": "DISBURSED", "separation_id": str(separation_id)}


service = OffboardingService()
