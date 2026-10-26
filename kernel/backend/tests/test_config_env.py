"""Tests for settings loading from real environment variables and .env files."""

import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from kernel.core.config import Settings, load_env


class TestEnvironmentVariables(unittest.TestCase):
    def test_comma_separated_lists_from_real_env(self) -> None:
        # Docker/Kubernetes set these as real environment variables; must not crash startup.
        env = {"CORS_ORIGINS": "http://a, http://b", "SETUP_ENABLED": "false", "PORT": "9001"}
        with patch.dict(os.environ, env), patch("kernel.core.config.env.find_env_files", return_value=[]):
            settings = Settings.load()
        self.assertEqual(settings.cors_origins, ["http://a", "http://b"])
        self.assertFalse(settings.setup_enabled)
        self.assertEqual(settings.port, 9001)

    def test_constructor_ignores_environment(self) -> None:
        with patch.dict(os.environ, {"CORS_ORIGINS": "not-json"}):
            self.assertEqual(Settings().cors_origins, ["http://localhost:4200", "http://127.0.0.1:4200"])


class TestLoadEnv(unittest.TestCase):
    def test_files_then_environment(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp, "a.env"), Path(tmp, "b.env")
            first.write_text("SETUP_ORG_NAME=From First\nONLY_FILE=1\n", encoding="utf-8")
            second.write_text("SETUP_ORG_NAME=From Second\nSETUP_ORG_SLUG=second\n", encoding="utf-8")
            with patch("kernel.core.config.env.find_env_files", return_value=[first, second]), \
                    patch.dict(os.environ, {"SETUP_ORG_SLUG": "from-env"}):
                merged = load_env()
        self.assertEqual(merged["SETUP_ORG_NAME"], "From First")  # first file wins
        self.assertEqual(merged["SETUP_ORG_SLUG"], "from-env")  # real env overrides files
        self.assertEqual(merged["ONLY_FILE"], "1")


if __name__ == "__main__":
    unittest.main()
