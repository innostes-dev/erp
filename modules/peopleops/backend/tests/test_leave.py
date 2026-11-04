import unittest
import uuid
from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from peopleops.leave.services import LeaveService
from peopleops.leave.schemas import LeaveApplicationCreate, LeaveActionRequest
from peopleops.models import HRMSLeaveType, HRMSLeaveApplication, HRMSLeaveLedger

class TestLeave(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.service = LeaveService()
        self.session = AsyncMock()
        self.tenant_id = uuid.uuid4()
        self.employee_id = uuid.uuid4()
        self.approver_id = uuid.uuid4()

    async def test_get_overview(self):
        res = await self.service.get_overview()
        self.assertEqual(res["submodule"], "leave")
        self.assertTrue(res["ready"])

    async def test_apply_leave(self):
        leave_type_id = uuid.uuid4()
        app_in = LeaveApplicationCreate(
            leave_type_id=leave_type_id,
            start_date=date(2026, 12, 24),
            end_date=date(2026, 12, 25),
            reason="Holiday"
        )
        
        self.session.add = MagicMock()
        self.session.flush = AsyncMock()
        
        app = await self.service.apply_leave(self.session, self.tenant_id, self.employee_id, app_in)
        
        self.assertEqual(app.tenant_id, self.tenant_id)
        self.assertEqual(app.employee_id, self.employee_id)
        self.assertEqual(app.leave_type_id, leave_type_id)
        self.assertEqual(app.total_days, Decimal("2"))
        self.assertEqual(app.status, "PENDING")
        self.session.add.assert_called_once()
        self.session.flush.assert_called_once()

    async def test_approve_leave(self):
        app_id = uuid.uuid4()
        leave_type_id = uuid.uuid4()
        app_mock = HRMSLeaveApplication(
            id=app_id,
            tenant_id=self.tenant_id,
            employee_id=self.employee_id,
            leave_type_id=leave_type_id,
            status="PENDING",
            total_days=Decimal("2.00")
        )
        
        self.session.add = MagicMock()
        self.session.flush = AsyncMock()
        
        # Mock session.execute to return our app_mock
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_mock
        self.session.execute = AsyncMock(return_value=result_mock)
        
        request = LeaveActionRequest(reason="Looks good")
        app = await self.service.approve_leave(self.session, self.tenant_id, app_id, self.approver_id, request)
        
        self.assertEqual(app.status, "APPROVED")
        self.assertEqual(app.approved_by, self.approver_id)
        self.assertEqual(self.session.add.call_count, 1) # Ledger added

    async def test_reject_leave(self):
        app_id = uuid.uuid4()
        app_mock = HRMSLeaveApplication(
            id=app_id,
            tenant_id=self.tenant_id,
            status="PENDING",
        )
        
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = app_mock
        self.session.execute = AsyncMock(return_value=result_mock)
        self.session.flush = AsyncMock()
        
        request = LeaveActionRequest(reason="Need coverage")
        app = await self.service.reject_leave(self.session, self.tenant_id, app_id, request)
        
        self.assertEqual(app.status, "REJECTED")
        self.assertEqual(app.rejection_reason, "Need coverage")
        self.session.flush.assert_called_once()

if __name__ == "__main__":
    unittest.main()
