"""User profile table (Personalization & UI Settings)."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class UserProfile(BaseModel):
    """Personalization, localization, and UI preferences (table `user_profiles`).

    1:1 with User. Keeps non-auth data off the core `users` row.
    """

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    preferred_language: Mapped[str] = mapped_column(String(16), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)  # Presentation only
    date_format: Mapped[str] = mapped_column(String(32), default="YYYY-MM-DD", nullable=False)
    time_format: Mapped[str] = mapped_column(String(16), default="24h", nullable=False)

    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    ui_preferences: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    user = relationship("User", back_populates="profile")
