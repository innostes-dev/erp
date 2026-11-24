"""Verify, with the FastAPI reference code, artifacts written by the Laravel implementation.

Usage: python verify_php_artifacts.py <artifacts.json>   (see tests/Unit/InteropTest.php)
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "kernel" / "backend"))

import bcrypt  # noqa: E402
import jwt  # noqa: E402

from kernel.core.crypto.cipher import BlindIndex, FieldCipher  # noqa: E402

data = json.load(open(sys.argv[1], encoding="utf-8"))


def key_bytes(secret: str) -> bytes:
    if len(secret) == 64 and all(c in "0123456789abcdefABCDEF" for c in secret):
        return bytes.fromhex(secret)
    return secret.encode("utf-8")[:32].ljust(32, b"\0")


cipher = FieldCipher(keyring={int(k): key_bytes(v) for k, v in data["keys"].items()}, current_version=1)
assert cipher.decrypt(data["envelope"]) == "php-written@example.com", "AES-GCM envelope"
assert cipher.decrypt(data["envelope_v2"]) == "php-written-v2@example.com", "AES-GCM envelope (key v2)"
assert BlindIndex(pepper=data["pepper"]).compute(" PHP@Example.com ") == data["blind"], "blind index"

access = jwt.decode(data["access"], data["jwt_secret"], algorithms=["HS256"])
assert access["type"] == "access" and access["token_version"] == 7 and access["sub"] == "abc", access
reset = jwt.decode(data["reset"], data["jwt_secret"], algorithms=["HS256"])
assert reset["type"] == "password_reset" and reset["token_version"] == 7, reset

assert data["bcrypt"].startswith("$2y$12$") or data["bcrypt"].startswith("$2y$04$"), data["bcrypt"]
assert bcrypt.checkpw(b"php-Passw0rd!", data["bcrypt"].encode()), "bcrypt $2y$ verifies in Python"
print("python verified php artifacts")
