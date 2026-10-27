"""Password history table to prevent password reuse."""

from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from kernel.core.database import BaseModel


class PasswordHistory(BaseModel):
    """Stores past password hashes to enforce password history limits (table `password_histories`)."""

    __tablename__ = "password_histories"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    user = relationship("User", back_populates="password_histories")
