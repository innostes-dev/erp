"""Login identities and credentials (tables `identities` and `credentials`).

An identity says *who* is logging in (email, phone, username, or an external social/SSO account).
A credential is the secret that *proves* it (password, PIN, TOTP secret, passkey, backup codes).
One user can have several of each, which is what makes email-first, phone-first, PIN and MFA
flows possible without changing the `users` table.

Schema: `migrations/sql/0010_identities_credentials.sql` (shared with the Laravel and NestJS kernels).
During the expand step the legacy columns on `users` are still kept in sync.
"""

from datetime import datetime
from enum import Enum
import uuid

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class IdentityType(str, Enum):
    """Kinds of login identifier."""

    EMAIL = "email"
    PHONE = "phone"
    USERNAME = "username"
    SOCIAL = "social"
    SSO = "sso"


class CredentialType(str, Enum):
    """Kinds of secret a user can prove an identity with."""

    PASSWORD = "password"
    PIN = "pin"
    TOTP = "totp"
    PASSKEY = "passkey"
    BACKUP_CODES = "backup_codes"


class Identity(BaseModel):
    """A login identifier owned by a user (table `identities`).

    Email/phone/username values are stored like the legacy user columns: an HMAC blind index
    (`value_hash`) for lookups and AES-GCM ciphertext (`value_encrypted`) for display.
    """

    __tablename__ = "identities"
    __table_args__ = (
        CheckConstraint("type IN ('email', 'phone', 'username', 'social', 'sso')", name="ck_identities_type"),
        CheckConstraint(
            "(type IN ('email', 'phone', 'username') AND value_hash IS NOT NULL AND value_encrypted IS NOT NULL) "
            "OR (type IN ('social', 'sso') AND provider IS NOT NULL AND provider_subject IS NOT NULL)",
            name="ck_identities_value",
        ),
        Index(
            "uq_identities_type_value_hash", "type", "value_hash",
            unique=True, postgresql_where=text("value_hash IS NOT NULL"),
        ),
        Index(
            "uq_identities_provider_subject", "provider", "provider_subject",
            unique=True, postgresql_where=text("provider_subject IS NOT NULL"),
        ),
        Index(
            "uq_identities_user_type_primary", "user_id", "type",
            unique=True, postgresql_where=text("is_primary AND deleted_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    value_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    value_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provider_subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user = relationship("User", back_populates="login_identities")


class Credential(BaseModel):
    """A secret that proves a user's identity (table `credentials`).

    Hashes go in `secret_hash` (password, PIN, backup codes); reversible secrets such as a TOTP seed go
    in `secret_encrypted`. `device_id` binds a credential to one device (used for PINs).
    """

    __tablename__ = "credentials"
    __table_args__ = (
        CheckConstraint(
            "type IN ('password', 'pin', 'totp', 'passkey', 'backup_codes')", name="ck_credentials_type"
        ),
        CheckConstraint("secret_hash IS NOT NULL OR secret_encrypted IS NOT NULL", name="ck_credentials_secret"),
        Index(
            "uq_credentials_user_password", "user_id",
            unique=True, postgresql_where=text("type = 'password' AND deleted_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    secret_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    secret_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_devices.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"), nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="credentials")
