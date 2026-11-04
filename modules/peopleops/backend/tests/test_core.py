import unittest
from peopleops.core.services import service, EmployeeService

class TestCoreService(unittest.IsolatedAsyncioTestCase):
    async def test_get_overview(self):
        result = await service.get_overview()
        self.assertEqual(result["submodule"], "core")
        self.assertTrue(result["ready"])

    def test_employee_service_initialization(self):
        emp_service = EmployeeService(session=None)
        self.assertIsNotNone(emp_service)

if __name__ == "__main__":
    unittest.main()
