import unittest
from peopleops.attendance.services import service
from peopleops.attendance.schemas import RegularizePunchRequest

class TestAttendanceService(unittest.IsolatedAsyncioTestCase):
    async def test_get_overview(self):
        result = await service.get_overview()
        self.assertEqual(result["submodule"], "attendance")
        self.assertTrue(result["ready"])

    async def test_process_punch_in(self):
        result = await service.process_punch("in")
        self.assertEqual(result["action"], "check-in")
        self.assertTrue(result["success"])

    async def test_process_punch_out(self):
        result = await service.process_punch("out")
        self.assertEqual(result["action"], "check-out")
        self.assertTrue(result["success"])

    async def test_get_daily_status(self):
        result = await service.get_daily_status()
        self.assertEqual(result["status"], "present")

    async def test_get_timesheets(self):
        result = await service.get_timesheets()
        self.assertIsInstance(result["timesheets"], list)

    async def test_regularize_punch(self):
        result = await service.regularize_punch(
            reason="Forgot to punch",
            punch_time="09:00",
            direction="in"
        )
        self.assertTrue(result["regularized"])
        self.assertEqual(result["reason"], "Forgot to punch")
        self.assertEqual(result["punch_time"], "09:00")
        self.assertEqual(result["direction"], "in")

if __name__ == "__main__":
    unittest.main()
