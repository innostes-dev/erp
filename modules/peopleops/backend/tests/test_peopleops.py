"""Unit tests for PeopleOps module."""

import unittest
from peopleops import PeopleOpsModule, module
from peopleops.router import router


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


if __name__ == "__main__":
    unittest.main()
