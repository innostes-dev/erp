"""Generate cross-backend interoperability vectors from the FastAPI reference implementation.

Run from the repo root:
    apps/api-server/.venv/bin/python kernel/backend-laravel/tests/fixtures/generate_vectors.py > kernel/backend-laravel/tests/fixtures/python_vectors.json
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "kernel" / "backend"))

import bcrypt  # noqa: E402
import jwt  # noqa: E402

from kernel.core.crypto.cipher import BlindIndex, FieldCipher  # noqa: E402

KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
KEY_TEXT = "short-utf8-key-not-hex"  # padded with NUL to 32 bytes
PEPPER = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
JWT_SECRET = "interop-test-secret-key-at-least-32-bytes-long"


def key_bytes(secret: str) -> bytes:
    if len(secret) == 64 and all(c in "0123456789abcdefABCDEF" for c in secret):
        return bytes.fromhex(secret)
    return secret.encode("utf-8")[:32].ljust(32, b"\0")


keyring = {1: key_bytes(KEY_HEX), 2: key_bytes(KEY_TEXT)}
cipher = FieldCipher(keyring=keyring, current_version=1)
blind = BlindIndex(pepper=PEPPER)

plaintexts = [
    ("admin@example.com", 1),
    ("+911234567890", 1),
    ("Ünïcödé-名前@example.com", 1),
    ("", 1),
    ("rotated-key@example.com", 2),
]
envelopes = [{"plaintext": p, "version": v, "envelope": cipher.encrypt(p, version=v)} for p, v in plaintexts]

blind_cases = [" Admin@Example.COM ", "user@example.com", "UPPER@EXAMPLE.COM", "+91 123"]
blind_vectors = [{"input": v, "hash": blind.compute(v)} for v in blind_cases]

now = datetime.now(timezone.utc)
claims = {
    "sub": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
    "email": "priya@example.com",
    "token_version": 3,
    "is_super_admin": True,
    "type": "access",
    "iat": int(now.timestamp()),
    "exp": int((now + timedelta(days=3650)).timestamp()),
}
access = jwt.encode(claims, JWT_SECRET, algorithm="HS256")
reset = jwt.encode(
    {"sub": claims["sub"], "type": "password_reset", "token_version": 3, "iat": claims["iat"], "exp": claims["exp"]},
    JWT_SECRET,
    algorithm="HS256",
)
expired = jwt.encode({**claims, "exp": int((now - timedelta(days=1)).timestamp())}, JWT_SECRET, algorithm="HS256")

passwords = ["Str0ng-Passw0rd!", "pässwörd-ünï", "x" * 72]
bcrypt_vectors = [
    {"password": p, "hash": bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=12)).decode()} for p in passwords
]

print(
    json.dumps(
        {
            "keys": {"1": KEY_HEX, "2": KEY_TEXT},
            "pepper": PEPPER,
            "jwt_secret": JWT_SECRET,
            "envelopes": envelopes,
            "blind_index": blind_vectors,
            "jwt": {"claims": claims, "access": access, "reset": reset, "expired": expired},
            "bcrypt": bcrypt_vectors,
        },
        indent=2,
        ensure_ascii=False,
    )
)
