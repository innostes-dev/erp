"""Cryptographic subsystem: AES-256-GCM Envelope Encryption & HMAC Blind Indexing.

Designed for zero-downtime key rotation, tamper-evident authenticated encryption,
and exact search on encrypted PII fields (email, mobile, MFA secrets).
"""

import base64
import hashlib
import hmac
import os
import re

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from kernel.core.config import get_settings


class CryptoError(Exception):
    """Base exception for cryptographic operations."""


class KeyNotFoundError(CryptoError):
    """Raised when an envelope requests a key version not present in the keyring."""


class DecryptionFailedError(CryptoError):
    """Raised when ciphertext authentication or integrity check fails."""


class BlindIndex:
    """Computes deterministic HMAC-SHA256 hashes for exact lookups over encrypted fields."""

    def __init__(self, pepper: str | None = None) -> None:
        self._pepper = pepper

    @property
    def pepper(self) -> str:
        if self._pepper is not None:
            return self._pepper
        return get_settings().blind_index_pepper.get_secret_value()

    def compute(self, value: str | None) -> str | None:
        """Normalize value and compute its HMAC-SHA256 hex digest.

        Returns None if value is None or empty.
        """
        if not value:
            return None
        normalized = value.strip().lower().encode("utf-8")
        return hmac.new(self.pepper.encode("utf-8"), normalized, hashlib.sha256).hexdigest()


class FieldCipher:
    """Handles AES-256-GCM envelope encryption and zero-downtime key rotation.

    Serialized Envelope Format:
        `v<version>:<base64_12_byte_nonce>:<base64_ciphertext_and_tag>`
    """

    ENVELOPE_REGEX = re.compile(r"^v(\d+):([A-Za-z0-9+/=]+):([A-Za-z0-9+/=]+)$")

    def __init__(
        self,
        keyring: dict[int, bytes] | None = None,
        current_version: int | None = None,
    ) -> None:
        self._keyring = keyring
        self._current_version = current_version

    def _get_keyring(self) -> tuple[dict[int, bytes], int]:
        """Resolves keyring and active key version from settings if not injected."""
        if self._keyring is not None and self._current_version is not None:
            return self._keyring, self._current_version

        settings = get_settings()
        active_version = settings.encryption_current_key_version
        keyring: dict[int, bytes] = {}

        for version, secret in settings.encryption_keys.items():
            key_raw = secret.get_secret_value()
            # If 64 hex characters (32 bytes hex-encoded), decode it
            if len(key_raw) == 64 and all(c in "0123456789abcdefABCDEF" for c in key_raw):
                key_bytes = bytes.fromhex(key_raw)
            else:
                # Fallback to UTF-8 padded or truncated to 32 bytes
                key_bytes = key_raw.encode("utf-8")[:32].ljust(32, b"\0")
            keyring[int(version)] = key_bytes

        if active_version not in keyring:
            raise KeyNotFoundError(f"Active encryption key version {active_version} not found in keyring.")

        return keyring, active_version

    def encrypt(self, plaintext: str | None, version: int | None = None) -> str | None:
        """Encrypt plaintext using AES-256-GCM into a versioned envelope string.

        Returns None if plaintext is None.
        """
        if plaintext is None:
            return None

        keyring, active_version = self._get_keyring()
        target_version = version or active_version

        if target_version not in keyring:
            raise KeyNotFoundError(f"Encryption key version {target_version} not found in keyring.")

        key = keyring[target_version]
        nonce = os.urandom(12)  # 96-bit standard nonce for AES-GCM
        aesgcm = AESGCM(key)
        ciphertext_and_tag = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)

        nonce_b64 = base64.b64encode(nonce).decode("ascii")
        ct_b64 = base64.b64encode(ciphertext_and_tag).decode("ascii")
        return f"v{target_version}:{nonce_b64}:{ct_b64}"

    def decrypt(self, envelope: str | None) -> str | None:
        """Decrypt a versioned envelope string using the matching keyring key.

        Returns None if envelope is None.
        """
        if envelope is None:
            return None

        match = self.ENVELOPE_REGEX.match(envelope.strip())
        if not match:
            raise DecryptionFailedError("Invalid ciphertext envelope format.")

        version = int(match.group(1))
        nonce = base64.b64decode(match.group(2))
        ciphertext_and_tag = base64.b64decode(match.group(3))

        keyring, _ = self._get_keyring()
        if version not in keyring:
            raise KeyNotFoundError(f"Cannot decrypt: Key version {version} not in active keyring.")

        key = keyring[version]
        aesgcm = AESGCM(key)

        try:
            plaintext_bytes = aesgcm.decrypt(nonce, ciphertext_and_tag, None)
            return plaintext_bytes.decode("utf-8")
        except (InvalidTag, ValueError) as exc:
            raise DecryptionFailedError("Ciphertext integrity verification failed or data corrupted.") from exc

    def get_envelope_version(self, envelope: str) -> int:
        """Extract the key version from an envelope string without decrypting."""
        match = self.ENVELOPE_REGEX.match(envelope.strip())
        if not match:
            raise DecryptionFailedError("Invalid ciphertext envelope format.")
        return int(match.group(1))

    def reencrypt(self, envelope: str, target_version: int | None = None) -> str:
        """Decrypt with current envelope key and re-encrypt with target key version."""
        plaintext = self.decrypt(envelope)
        if plaintext is None:
            raise DecryptionFailedError("Cannot re-encrypt empty envelope.")
        return self.encrypt(plaintext, version=target_version)  # type: ignore[return-value]


# Global shared instances
cipher = FieldCipher()
blind_index = BlindIndex()
