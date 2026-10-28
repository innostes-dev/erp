"""Unit tests for API Logger plugin."""

import unittest
from api_logger import ApiLoggerPlugin, plugin
from api_logger.router import router


class TestApiLoggerPlugin(unittest.IsolatedAsyncioTestCase):
    def test_plugin_metadata(self):
        self.assertEqual(plugin.name, "api-logger")
        self.assertEqual(plugin.version, "0.1.0")
        self.assertIsNotNone(plugin.router)
        self.assertEqual(len(plugin.openapi_tags), 1)

    async def test_health_check(self):
        health = await plugin.health_check()
        self.assertEqual(health["status"], "HEALTHY")
        self.assertEqual(health["plugin"], "api-logger")


if __name__ == "__main__":
    unittest.main()
