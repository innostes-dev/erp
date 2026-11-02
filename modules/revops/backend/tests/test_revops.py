"""Unit tests for RevOps module."""

import unittest
from revops import RevOpsModule, module
from revops.router import router


class TestRevOpsModule(unittest.IsolatedAsyncioTestCase):
    def test_module_metadata(self):
        self.assertEqual(module.name, "revops")
        self.assertEqual(module.version, "0.1.0")
        self.assertIsNotNone(module.router)
        self.assertEqual(len(module.openapi_tags), 1)

    async def test_health_check(self):
        health = await module.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["module"], "revops")


if __name__ == "__main__":
    unittest.main()
