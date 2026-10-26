"""Security Data Schemas for Innostes ERP Kernel."""

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class TokenType(str, Enum):
    """Enumeration of recognized token types."""

    ACCESS = "access"
    REFRESH = "refresh"


class TokenPair(BaseModel):
    """Pair of access and refresh tokens returned upon authentication."""

    access_token: str = Field(description="Short-lived JWT access token")
    refresh_token: str = Field(description="Long-lived JWT refresh token")
    token_type: str = Field(default="bearer", description="Token authorization type")
    expires_in: int = Field(description="Access token lifespan in seconds")


class TokenPayload(BaseModel):
    """Standardized representation of a decoded JWT payload."""

    sub: str = Field(description="Subject identifier (e.g. user_id)")
    type: str = Field(description="Token type ('access' or 'refresh')")
    exp: int = Field(description="Expiration timestamp (epoch seconds)")
    iat: int = Field(description="Issued-at timestamp (epoch seconds)")
    nbf: int | None = Field(default=None, description="Not-before timestamp (epoch seconds)")
    jti: str | None = Field(default=None, description="Unique JWT ID for revocation tracking")
    claims: dict[str, Any] = Field(default_factory=dict, description="Custom application claims")

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TokenPayload":
        """Construct a TokenPayload, extracting standard claims and preserving custom claims."""
        standard_keys = {"sub", "type", "exp", "iat", "nbf", "jti"}
        standard_data = {k: v for k, v in data.items() if k in standard_keys}
        extra_claims = {k: v for k, v in data.items() if k not in standard_keys}
        return cls(**standard_data, claims=extra_claims)
