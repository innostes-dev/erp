"""Unit tests for Innostes ERP Kernel Security Package."""

from datetime import timedelta
from pathlib import Path
import sys
import unittest

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from kernel.security import (
    InvalidTokenError,
    TokenExpiredError,
    TokenPair,
    TokenPayload,
    TokenType,
    TokenTypeMismatchError,
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    get_current_subject,
    get_token_payload,
    hash_password,
    parse_token_payload,
    verify_password,
    verify_token,
)


class TestKernelSecurityPassword(unittest.TestCase):
    """Test bcrypt password hashing and verification."""

    def test_hash_and_verify_password(self) -> None:
        raw_password = "super-secret-password-123!"
        hashed = hash_password(raw_password)

        self.assertNotEqual(raw_password, hashed)
        self.assertTrue(hashed.startswith("$2b$") or hashed.startswith("$2a$"))
        self.assertTrue(verify_password(raw_password, hashed))
        self.assertFalse(verify_password("wrong-password", hashed))

    def test_verify_password_invalid_hash(self) -> None:
        self.assertFalse(verify_password("any_pass", "not-a-valid-hash"))


class TestKernelSecurityJWT(unittest.TestCase):
    """Test JWT generation, refresh tokens, and validation."""

    def test_create_access_token_with_payload(self) -> None:
        custom_payload = {
            "email": "dev@innostes.com",
            "role": "erp_admin",
            "org_id": "org_001",
        }
        token = create_access_token(
            subject="usr_admin_1",
            payload=custom_payload,
        )

        decoded = decode_token(token)
        self.assertEqual(decoded["sub"], "usr_admin_1")
        self.assertEqual(decoded["type"], TokenType.ACCESS.value)
        self.assertEqual(decoded["email"], "dev@innostes.com")
        self.assertEqual(decoded["role"], "erp_admin")
        self.assertEqual(decoded["org_id"], "org_001")
        self.assertIn("jti", decoded)
        self.assertIn("iat", decoded)
        self.assertIn("exp", decoded)

    def test_create_refresh_token(self) -> None:
        token = create_refresh_token(subject="usr_999")
        decoded = decode_token(token)

        self.assertEqual(decoded["sub"], "usr_999")
        self.assertEqual(decoded["type"], TokenType.REFRESH.value)

    def test_create_token_pair(self) -> None:
        pair = create_token_pair(
            subject="usr_555",
            payload={"tenant": "acme_corp"},
        )
        self.assertIsInstance(pair, TokenPair)
        self.assertEqual(pair.token_type, "bearer")
        self.assertGreater(pair.expires_in, 0)

        # Verify access token
        access_claims = verify_token(pair.access_token, expected_type=TokenType.ACCESS)
        self.assertEqual(access_claims["sub"], "usr_555")
        self.assertEqual(access_claims["tenant"], "acme_corp")

        # Verify refresh token
        refresh_claims = verify_token(pair.refresh_token, expected_type=TokenType.REFRESH)
        self.assertEqual(refresh_claims["sub"], "usr_555")

    def test_token_type_mismatch_validation(self) -> None:
        refresh_token = create_refresh_token(subject="usr_123")

        # Passing refresh token where access token is expected should raise TokenTypeMismatchError
        with self.assertRaises(TokenTypeMismatchError):
            verify_token(refresh_token, expected_type=TokenType.ACCESS)

        # But verifying as refresh should succeed
        claims = verify_token(refresh_token, expected_type=TokenType.REFRESH)
        self.assertEqual(claims["sub"], "usr_123")

    def test_token_expired(self) -> None:
        expired_token = create_access_token(
            subject="usr_123",
            expires_delta=timedelta(seconds=-10),
        )
        with self.assertRaises(TokenExpiredError):
            verify_token(expired_token)

    def test_invalid_token_signature(self) -> None:
        token = create_access_token(subject="usr_123")
        tampered_token = token[:-5] + "XXXXX"

        with self.assertRaises(InvalidTokenError):
            verify_token(tampered_token)

    def test_parse_token_payload_model(self) -> None:
        token = create_access_token(
            subject="usr_model_1",
            payload={"department": "finance", "level": 3},
        )
        model = parse_token_payload(token)
        self.assertIsInstance(model, TokenPayload)
        self.assertEqual(model.sub, "usr_model_1")
        self.assertEqual(model.type, "access")
        self.assertEqual(model.claims["department"], "finance")
        self.assertEqual(model.claims["level"], 3)


class TestKernelSecurityFastAPIDependencies(unittest.TestCase):
    """Test FastAPI authentication dependencies."""

    def setUp(self) -> None:
        app = FastAPI()

        @app.get("/protected")
        def protected_route(subject: str = Depends(get_current_subject)) -> dict[str, str]:
            return {"user": subject}

        @app.get("/claims")
        def claims_route(payload: dict = Depends(get_token_payload)) -> dict:
            return payload

        self.client = TestClient(app)

    def test_protected_route_success(self) -> None:
        token = create_access_token("usr_authenticated", payload={"scope": "read:erp"})
        response = self.client.get(
            "/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"user": "usr_authenticated"})

    def test_protected_route_expired_token(self) -> None:
        token = create_access_token("usr_auth", expires_delta=timedelta(seconds=-5))
        response = self.client.get(
            "/protected",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("expired", response.json()["detail"].lower())

    def test_protected_route_refresh_token_rejected(self) -> None:
        refresh_token = create_refresh_token("usr_auth")
        response = self.client.get(
            "/protected",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("expected token type 'access'", response.json()["detail"].lower())

    def test_protected_route_missing_header(self) -> None:
        response = self.client.get("/protected")
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
