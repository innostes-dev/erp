"""Unit tests for CRM module."""

import unittest
from crm import CrmModule, module
from crm.router import router


class TestCrmModule(unittest.IsolatedAsyncioTestCase):
    def test_module_metadata(self):
        self.assertEqual(module.name, "crm")
        self.assertEqual(module.version, "0.1.0")
        self.assertIsNotNone(module.router)
        self.assertEqual(len(module.openapi_tags), 1)

    async def test_health_check(self):
        health = await module.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["module"], "crm")


if __name__ == "__main__":
    unittest.main()
