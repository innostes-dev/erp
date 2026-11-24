"""Reads Node-produced artifacts as JSON on stdin and verifies them with the FastAPI reference implementation.

Run from the repo root with PYTHONPATH=kernel/backend (used by src/crypto/interop.spec.ts).
"""
import json
import sys

import bcrypt
import jwt

from kernel.core.crypto.cipher import BlindIndex, FieldCipher

d = json.load(sys.stdin)
keyring = {1: bytes.fromhex(d["hexKey"]), 2: d["rawKey"].encode()[:32].ljust(32, b"\0")}
res = {"decrypted": [], "blind": [], "jwt": None, "bcrypt": []}
for item in d["envelopes"]:
    res["decrypted"].append(FieldCipher(keyring=keyring, current_version=1).decrypt(item["envelope"]))
bi = BlindIndex(pepper=d["pepper"])
res["blind"] = [bi.compute(v) for v in d["blindValues"]]
res["jwt"] = jwt.decode(d["jwt"], d["jwtSecret"], algorithms=["HS256"])
res["bcrypt"] = [bcrypt.checkpw(b["plain"].encode(), b["hash"].encode()) for b in d["bcrypt"]]
print(json.dumps(res))
