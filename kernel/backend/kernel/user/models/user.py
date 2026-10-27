"""Core User table (Authentication & Common Identity)."""

from datetime import datetime, timezone
from enum import Enum
import uuid

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class UserStatus(str, Enum):
    """Lifecycle status for user accounts."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(BaseModel):
    """Common identity root for all actors (table `users`).

    Holds minimal credentials, envelope-encrypted PII, and security state.
    Presentation preferences live in `UserProfile`.
    """

    __tablename__ = "users"

    # Legal Names
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Identifiers (Blind Indexed HMAC + AES-256-GCM Envelope Ciphertext)
    email_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email_encrypted: Mapped[str] = mapped_column(Text, nullable=False)

    mobile_hash: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    mobile_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Authentication & Security
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        ENUM(UserStatus, name="user_status_enum", create_type=False),
        default=UserStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # First-login reset & Temporary credentials
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    temp_password_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Invalidation & Rate limiting
    token_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Key rotation tracking
    key_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    security = relationship("UserSecurity", back_populates="user", uselist=False, cascade="all, delete-orphan")
    password_histories = relationship("PasswordHistory", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    identities = relationship("UserIdentity", back_populates="user", cascade="all, delete-orphan")
    roles = relationship("UserRole", foreign_keys="UserRole.user_id", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        """Formatted full name."""
        return f"{self.first_name} {self.last_name}".strip() if self.last_name else self.first_name

    @property
    def is_blocked(self) -> bool:
        """True if the account is administratively suspended or temporarily locked."""
        if self.status == UserStatus.SUSPENDED:
            return True
        if self.blocked_until is not None:
            now_utc = datetime.now(timezone.utc)
            # Ensure timezone awareness for comparison
            blocked_utc = self.blocked_until if self.blocked_until.tzinfo else self.blocked_until.replace(tzinfo=timezone.utc)
            return blocked_utc > now_utc
        return False
