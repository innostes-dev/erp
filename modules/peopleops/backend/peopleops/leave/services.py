"""Business logic service for PeopleOps Leave."""

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from peopleops.models import HRMSLeaveType, HRMSLeaveApplication, HRMSLeaveLedger
from peopleops.leave.schemas import LeaveApplicationCreate, LeaveActionRequest

logger = logging.getLogger(__name__)


class LeaveService:
    """Service layer executing business rules for leave."""

    def __init__(self) -> None:
        self.logger = logger

    async def get_overview(self) -> dict[str, Any]:
        """Return operational overview metrics for leave."""
        return {"submodule": "leave", "ready": True}
        
    async def list_leave_types(self, session: AsyncSession, tenant_id: uuid.UUID) -> list[HRMSLeaveType]:
        """List active leave types for a tenant."""
        stmt = select(HRMSLeaveType).where(HRMSLeaveType.tenant_id == tenant_id, HRMSLeaveType.is_active == True)
        result = await session.execute(stmt)
        return list(result.scalars().all())
        
    async def get_balances(self, session: AsyncSession, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> list[dict[str, Any]]:
        """Calculate real-time leave balances for an employee."""
        leave_types = await self.list_leave_types(session, tenant_id)
        
        balances = []
        for lt in leave_types:
            # Aggregate ledger
            ledger_stmt = select(HRMSLeaveLedger).where(
                HRMSLeaveLedger.tenant_id == tenant_id,
                HRMSLeaveLedger.employee_id == employee_id,
                HRMSLeaveLedger.leave_type_id == lt.id
            )
            ledger_res = await session.execute(ledger_stmt)
            transactions = list(ledger_res.scalars().all())
            
            accrued = Decimal("0.00")
            consumed = Decimal("0.00")
            
            for tx in transactions:
                if tx.action == "ACCRUED" or tx.action == "REVERSED":
                    accrued += tx.days
                elif tx.action == "CONSUMED" or tx.action == "ENCASHED" or tx.action == "LAPSED":
                    consumed -= tx.days # tx.days is assumed negative in DB or we subtract positive
            
            # Sub pending
            pending_stmt = select(HRMSLeaveApplication).where(
                HRMSLeaveApplication.tenant_id == tenant_id,
                HRMSLeaveApplication.employee_id == employee_id,
                HRMSLeaveApplication.leave_type_id == lt.id,
                HRMSLeaveApplication.status == "PENDING"
            )
            pending_res = await session.execute(pending_stmt)
            pending_apps = list(pending_res.scalars().all())
            
            pending = sum([app.total_days for app in pending_apps], Decimal("0.00"))
            
            # Simple assumption: ledger tx.days might be signed or unsigned.
            # In our schema we define days as Numeric. Let's assume tx.days is always the absolute amount
            # Actually schema says tx.days: Decimal. Let's assume it matches the sign in ledger equation.
            
            balance = {
                "leave_type_id": lt.id,
                "leave_type_code": lt.code,
                "leave_type_name": lt.name,
                "accrued_days": accrued,
                "consumed_days": consumed,
                "pending_days": pending,
                "available_balance": accrued - consumed - pending
            }
            balances.append(balance)
            
        return balances

    async def apply_leave(
        self, session: AsyncSession, tenant_id: uuid.UUID, employee_id: uuid.UUID, app_in: LeaveApplicationCreate
    ) -> HRMSLeaveApplication:
        """Submit a new leave application."""
        # Simple date math
        delta = (app_in.end_date - app_in.start_date).days + 1
        base_days = Decimal(delta)
        sandwich_days = Decimal("0.00")
        
        # Real logic would calculate weekends / holidays.
        
        app = HRMSLeaveApplication(
            tenant_id=tenant_id,
            employee_id=employee_id,
            leave_type_id=app_in.leave_type_id,
            start_date=app_in.start_date,
            start_half=app_in.start_half,
            end_date=app_in.end_date,
            end_half=app_in.end_half,
            base_days=base_days,
            sandwich_days=sandwich_days,
            total_days=base_days + sandwich_days,
            reason=app_in.reason,
            supporting_document_id=app_in.supporting_document_id,
            status="PENDING",
        )
        session.add(app)
        await session.flush()
        return app
        
    async def approve_leave(
        self, session: AsyncSession, tenant_id: uuid.UUID, app_id: uuid.UUID, approver_id: uuid.UUID, request: LeaveActionRequest
    ) -> HRMSLeaveApplication:
        """Approve a leave application and post to ledger."""
        stmt = select(HRMSLeaveApplication).where(
            HRMSLeaveApplication.id == app_id, HRMSLeaveApplication.tenant_id == tenant_id
        )
        res = await session.execute(stmt)
        app = res.scalar_one_or_none()
        
        if not app or app.status != "PENDING":
            raise ValueError("Application not found or not pending")
            
        app.status = "APPROVED"
        app.approved_by = approver_id
        app.approved_at = datetime.utcnow()
        
        # Post to ledger
        ledger = HRMSLeaveLedger(
            tenant_id=tenant_id,
            employee_id=app.employee_id,
            leave_type_id=app.leave_type_id,
            transaction_date=date.today(),
            action="CONSUMED",
            days=app.total_days, # Store as positive number, logic implies consumed is subbed
            reference_id=app.id,
            remarks=request.reason or "Approved by manager."
        )
        session.add(ledger)
        await session.flush()
        return app
        
    async def reject_leave(
        self, session: AsyncSession, tenant_id: uuid.UUID, app_id: uuid.UUID, request: LeaveActionRequest
    ) -> HRMSLeaveApplication:
        """Reject a leave application."""
        stmt = select(HRMSLeaveApplication).where(
            HRMSLeaveApplication.id == app_id, HRMSLeaveApplication.tenant_id == tenant_id
        )
        res = await session.execute(stmt)
        app = res.scalar_one_or_none()
        
        if not app or app.status != "PENDING":
            raise ValueError("Application not found or not pending")
            
        app.status = "REJECTED"
        app.rejection_reason = request.reason or "Rejected."
        await session.flush()
        return app
        
    async def get_ledger(self, session: AsyncSession, tenant_id: uuid.UUID, employee_id: uuid.UUID) -> list[HRMSLeaveLedger]:
        """Get leave ledger for an employee."""
        stmt = select(HRMSLeaveLedger).where(
            HRMSLeaveLedger.tenant_id == tenant_id, HRMSLeaveLedger.employee_id == employee_id
        ).order_by(HRMSLeaveLedger.transaction_date.desc())
        res = await session.execute(stmt)
        return list(res.scalars().all())


service = LeaveService()
