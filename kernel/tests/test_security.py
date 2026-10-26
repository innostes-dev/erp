"""Tests for JWT Generation and Refresh Token."""

from pathlib import Path
import sys
import unittest

repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from kernel.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestJWTSecurity(unittest.TestCase):
    """Test generating JWT with payload and refresh token."""

    def test_create_access_token_with_payload(self) -> None:
        payload = {"sub": "user_123", "role": "admin"}
        token = create_access_token(payload=payload)

        decoded = decode_token(token)
        self.assertEqual(decoded["sub"], "user_123")
        self.assertEqual(decoded["role"], "admin")
        self.assertEqual(decoded["type"], "access")
        self.assertIn("exp", decoded)

    def test_create_refresh_token(self) -> None:
        payload = {"sub": "user_123"}
        token = create_refresh_token(payload=payload)

        decoded = decode_token(token)
        self.assertEqual(decoded["sub"], "user_123")
        self.assertEqual(decoded["type"], "refresh")
        self.assertIn("exp", decoded)


if __name__ == "__main__":
    unittest.main()
