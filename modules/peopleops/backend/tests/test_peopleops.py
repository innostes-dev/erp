"""Unit tests for PeopleOps module and Phase 0 anchor."""

import unittest
from peopleops import PeopleOpsModule, module
from peopleops.router import router
import peopleops.models as models


class TestPeopleOpsModule(unittest.IsolatedAsyncioTestCase):
    def test_module_metadata(self):
        self.assertEqual(module.name, "peopleops")
        self.assertEqual(module.version, "0.1.0")
        self.assertIsNotNone(module.router)
        self.assertEqual(len(module.openapi_tags), 1)

    async def test_health_check(self):
        health = await module.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["module"], "peopleops")

    def test_sub_routers_registered(self):
        """Verify that all Phase 0 sub-routers are wired into PeopleOps root router."""
        paths = []

        def collect_paths(r_list):
            for r in r_list:
                if hasattr(r, "path"):
                    paths.append(r.path)
                elif hasattr(r, "original_router"):
                    collect_paths(r.original_router.routes)

        collect_paths(router.routes)

        # Check root info endpoint
        self.assertIn("/peopleops/info", paths)
        # Check sub-router endpoints
        self.assertIn("/masters/departments", paths)
        self.assertIn("/core/employees", paths)
        self.assertIn("/attendance/check-in", paths)
        self.assertIn("/leave/types", paths)
        self.assertIn("/payroll/runs", paths)
        self.assertIn("/expenses/categories", paths)
        self.assertIn("/offboarding/separations", paths)

    def test_models_exist(self):
        """Verify canonical SQLAlchemy models exist for all major entities."""
        self.assertTrue(hasattr(models, "HRMSDepartment"))
        self.assertTrue(hasattr(models, "HRMSDesignation"))
        self.assertTrue(hasattr(models, "HRMSLocation"))
        self.assertTrue(hasattr(models, "HRMSHolidayCalendar"))
        self.assertTrue(hasattr(models, "HRMSPicklist"))
        self.assertTrue(hasattr(models, "HRMSParty"))
        self.assertTrue(hasattr(models, "KernelAadhaarVault"))
        self.assertTrue(hasattr(models, "HRMSStatutoryIdentity"))
        self.assertTrue(hasattr(models, "HRMSEmployee"))
        self.assertTrue(hasattr(models, "HRMSContract"))
        self.assertTrue(hasattr(models, "HRMSAttendancePunch"))
        self.assertTrue(hasattr(models, "HRMSAttendanceBlock"))
        self.assertTrue(hasattr(models, "HRMSMonthlyTimesheet"))
        self.assertTrue(hasattr(models, "HRMSLeaveType"))
        self.assertTrue(hasattr(models, "HRMSLeaveApplication"))
        self.assertTrue(hasattr(models, "HRMSLeaveLedger"))
        self.assertTrue(hasattr(models, "HRMSPayrollSetting"))
        self.assertTrue(hasattr(models, "HRMSSalaryComponent"))
        self.assertTrue(hasattr(models, "HRMSSalaryStructure"))
        self.assertTrue(hasattr(models, "HRMSPayrollRun"))
        self.assertTrue(hasattr(models, "HRMSPayslip"))
        self.assertTrue(hasattr(models, "HRMSExpenseCategory"))
        self.assertTrue(hasattr(models, "HRMSExpenseClaimReport"))
        self.assertTrue(hasattr(models, "HRMSSeparation"))
        self.assertTrue(hasattr(models, "HRMSSettlementSheet"))


if __name__ == "__main__":
    unittest.main()
