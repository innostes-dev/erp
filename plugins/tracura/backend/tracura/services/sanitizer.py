"""Multi-Vector PII & Secret Redaction Engine."""

import ipaddress
import json
import re
from typing import Any

# Pattern matching standard JSON Web Tokens (JWT)
JWT_PATTERN = re.compile(r"ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+")

DEFAULT_SENSITIVE_HEADERS = {
    "authorization",
    "cookie",
    "x-api-key",
    "proxy-authorization",
    "set-cookie",
    "x-auth-token",
}

DEFAULT_SENSITIVE_KEYS = {
    "password",
    "secret",
    "credit_card",
    "card_number",
    "token",
    "cvv",
    "cvc",
    "ssn",
    "access_token",
    "refresh_token",
    "api_key",
    "client_secret",
}


class SanitizerService:
    """Sanitizes headers, query params, JSON bodies, and client IPs."""

    def __init__(
        self,
        sensitive_headers: set[str] | None = None,
        sensitive_keys: set[str] | None = None,
        max_body_size_bytes: int = 4096,
        mask_client_ip: bool = False,
    ) -> None:
        self.sensitive_headers = {h.lower() for h in (sensitive_headers or DEFAULT_SENSITIVE_HEADERS)}
        self.sensitive_keys = {k.lower() for k in (sensitive_keys or DEFAULT_SENSITIVE_KEYS)}
        self.max_body_size_bytes = max_body_size_bytes
        self.mask_client_ip = mask_client_ip

    def sanitize_headers(self, headers: dict[str, Any] | None) -> dict[str, Any] | None:
        """Redact sensitive HTTP headers."""
        if not headers:
            return None
        sanitized: dict[str, Any] = {}
        for key, val in headers.items():
            if str(key).lower() in self.sensitive_headers:
                sanitized[key] = "[REDACTED]"
            elif isinstance(val, str) and JWT_PATTERN.search(val):
                sanitized[key] = JWT_PATTERN.sub("[REDACTED_JWT]", val)
            else:
                sanitized[key] = val
        return sanitized

    def sanitize_query_params(self, params: dict[str, Any] | None) -> dict[str, Any] | None:
        """Redact sensitive query parameters."""
        if not params:
            return None
        sanitized: dict[str, Any] = {}
        for key, val in params.items():
            if any(s in str(key).lower() for s in self.sensitive_keys):
                sanitized[key] = "[REDACTED]"
            elif isinstance(val, str) and JWT_PATTERN.search(val):
                sanitized[key] = JWT_PATTERN.sub("[REDACTED_JWT]", val)
            else:
                sanitized[key] = val
        return sanitized

    def sanitize_body(self, body: Any) -> Any:
        """Recursively redact sensitive fields and JWT patterns from request/response bodies."""
        if body is None:
            return None

        redacted = self._redact_recursive(body)

        # Enforce size limit
        try:
            serialized = json.dumps(redacted, default=str)
            if len(serialized.encode("utf-8")) > self.max_body_size_bytes:
                return {
                    "_truncated": True,
                    "_byte_size": len(serialized.encode("utf-8")),
                    "_max_allowed": self.max_body_size_bytes,
                    "_preview": serialized[:256] + "... [TRUNCATED]",
                }
        except Exception:
            pass

        return redacted

    def _redact_recursive(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            new_dict: dict[str, Any] = {}
            for k, v in obj.items():
                k_str = str(k).lower()
                if any(s in k_str for s in self.sensitive_keys):
                    new_dict[k] = "[REDACTED]"
                else:
                    new_dict[k] = self._redact_recursive(v)
            return new_dict
        elif isinstance(obj, list):
            return [self._redact_recursive(item) for item in obj]
        elif isinstance(obj, str):
            if JWT_PATTERN.search(obj):
                return JWT_PATTERN.sub("[REDACTED_JWT]", obj)
            return obj
        return obj

    def mask_ip(self, ip_str: str | None) -> str | None:
        """Zero-mask client IP address for privacy compliance (e.g. 192.168.1.100 -> 192.168.1.0)."""
        if not ip_str or not self.mask_client_ip:
            return ip_str
        try:
            ip = ipaddress.ip_address(ip_str.strip())
            if isinstance(ip, ipaddress.IPv4Address):
                # Mask last octet
                network = ipaddress.ip_network(f"{ip}/24", strict=False)
                return str(network.network_address)
            elif isinstance(ip, ipaddress.IPv6Address):
                # Mask to /64
                network = ipaddress.ip_network(f"{ip}/64", strict=False)
                return str(network.network_address)
        except ValueError:
            return "[ANONYMIZED_IP]"
        return ip_str
