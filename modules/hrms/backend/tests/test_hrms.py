"""Unit tests for HRMS module."""

import unittest
from hrms import HrmsModule, module
from hrms.router import router


class TestHrmsModule(unittest.IsolatedAsyncioTestCase):
    def test_module_metadata(self):
        self.assertEqual(module.name, "hrms")
        self.assertEqual(module.version, "0.1.0")
        self.assertIsNotNone(module.router)
        self.assertEqual(len(module.openapi_tags), 1)

    async def test_health_check(self):
        health = await module.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["module"], "hrms")


if __name__ == "__main__":
    unittest.main()
