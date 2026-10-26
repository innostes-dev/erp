"""Tests for the setup token and the wrong-guess limiter."""

from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pydantic import SecretStr

from kernel.core.config import Settings
from kernel.setup.services import (
    AttemptLimiter,
    discard_setup_token,
    get_setup_token,
    verify_setup_token,
)


class TestSetupToken(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.file = Path(self.tmp.name) / "nested" / "setup-token"

    def settings(self, token: str | None = None) -> Settings:
        return Settings(setup_token=SecretStr(token) if token else None, setup_token_file=self.file)

    def test_env_token_wins_and_no_file_is_written(self) -> None:
        token = get_setup_token(self.settings("from-env"))
        self.assertEqual((token.value, token.from_env), ("from-env", True))
        self.assertFalse(self.file.exists())

    def test_generated_once_and_reused(self) -> None:
        first = get_setup_token(self.settings())
        self.assertFalse(first.from_env)
        self.assertTrue(self.file.is_file())
        self.assertGreaterEqual(len(first.value), 40)
        self.assertEqual(get_setup_token(self.settings()).value, first.value)

    def test_verify(self) -> None:
        settings = self.settings("secret")
        self.assertTrue(verify_setup_token("secret", settings))
        self.assertFalse(verify_setup_token("Secret", settings))
        self.assertFalse(verify_setup_token("", settings))
        self.assertFalse(verify_setup_token(None, settings))

    def test_uses_constant_time_compare(self) -> None:
        with patch("kernel.setup.services.token.hmac.compare_digest", return_value=True) as compare:
            self.assertTrue(verify_setup_token("x", self.settings("y")))
        compare.assert_called_once()

    def test_discard_removes_generated_file(self) -> None:
        settings = self.settings()
        get_setup_token(settings)
        discard_setup_token(settings)
        self.assertFalse(self.file.exists())
        discard_setup_token(settings)  # no error when already gone


class TestAttemptLimiter(unittest.TestCase):
    def test_blocks_after_max_and_resets(self) -> None:
        limiter = AttemptLimiter(max_attempts=3, window_seconds=60)
        for _ in range(3):
            self.assertIsNone(limiter.retry_after("1.2.3.4"))
            limiter.record_failure("1.2.3.4")
        wait = limiter.retry_after("1.2.3.4")
        self.assertIsNotNone(wait)
        self.assertTrue(0 < wait <= 61)
        self.assertIsNone(limiter.retry_after("5.6.7.8"))  # other clients unaffected
        limiter.reset("1.2.3.4")
        self.assertIsNone(limiter.retry_after("1.2.3.4"))

    def test_window_expires(self) -> None:
        limiter = AttemptLimiter(max_attempts=1, window_seconds=10)
        with patch("kernel.setup.services.token.time.monotonic", return_value=100.0):
            limiter.record_failure("c")
            self.assertIsNotNone(limiter.retry_after("c"))
        with patch("kernel.setup.services.token.time.monotonic", return_value=111.0):
            self.assertIsNone(limiter.retry_after("c"))


if __name__ == "__main__":
    unittest.main()
