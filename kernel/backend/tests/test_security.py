"""Tests for JWT Generation and Refresh Token."""

import unittest

from kernel.core.security import (
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
