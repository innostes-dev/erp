"""Generate cross-backend compatibility vectors from the FastAPI reference implementation.

Run from the repo root:
  PYTHONPATH=kernel/backend apps/api-server/.venv/bin/python kernel/backend-nestjs/test/fixtures/generate_python_vectors.py
Writes kernel/backend-nestjs/test/fixtures/python-vectors.json
"""
import json
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt

from kernel.core.crypto.cipher import BlindIndex, FieldCipher

HEX_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
RAW_KEY = "short-utf8-key"
PEPPER = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
JWT_SECRET = "vector-secret-key-0123456789-abcdefghijklmnop"

keyring = {1: bytes.fromhex(HEX_KEY), 2: RAW_KEY.encode()[:32].ljust(32, b"\0")}
cipher = FieldCipher(keyring=keyring, current_version=1)
cipher2 = FieldCipher(keyring=keyring, current_version=2)
bi = BlindIndex(pepper=PEPPER)

plaintexts = ["ada@example.com", "+911234567890", "Ünïcödé ✓ 日本語", "x"]
envelopes = []
for p in plaintexts:
    envelopes.append({"plaintext": p, "version": 1, "envelope": cipher.encrypt(p)})
    envelopes.append({"plaintext": p, "version": 2, "envelope": cipher2.encrypt(p)})

blind = [{"value": v, "hash": bi.compute(v)} for v in ["Ada@Example.com", "  ada@example.com  ", "+911234567890"]]

now = datetime.now(timezone.utc)
access = jwt.encode(
    {
        "sub": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
        "email": "ada@example.com",
        "token_version": 3,
        "is_super_admin": True,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=3650)).timestamp()),
    },
    JWT_SECRET,
    algorithm="HS256",
)

pw = "Str0ng-Passw0rd!"
out = {
    "hexKey": HEX_KEY,
    "rawKey": RAW_KEY,
    "pepper": PEPPER,
    "jwtSecret": JWT_SECRET,
    "envelopes": envelopes,
    "blindIndex": blind,
    "accessToken": access,
    "password": pw,
    "bcryptHash": bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode(),
    "bcryptHash2y": bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode().replace("$2b$", "$2y$", 1),
    "refreshToken": "abc123",
    "refreshTokenSha256": hashlib.sha256(b"abc123").hexdigest(),
}
DEFAULT_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
default_cipher = FieldCipher(keyring={1: bytes.fromhex(DEFAULT_KEY)}, current_version=1)
default_bi = BlindIndex(pepper=PEPPER)
out["defaultRow"] = {
    "email": "Interop@Example.com",
    "mobile": "+15550001111",
    "password": "Interop-Passw0rd!",
    "email_hash": default_bi.compute("Interop@Example.com"),
    "email_encrypted": default_cipher.encrypt("Interop@Example.com"),
    "mobile_hash": default_bi.compute("+15550001111"),
    "mobile_encrypted": default_cipher.encrypt("+15550001111"),
    "password_hash_2b": bcrypt.hashpw(b"Interop-Passw0rd!", bcrypt.gensalt()).decode(),
    "password_hash_2y": bcrypt.hashpw(b"Interop-Passw0rd!", bcrypt.gensalt()).decode().replace("$2b$", "$2y$", 1),
}
Path(__file__).with_name("python-vectors.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))
print("ok")
