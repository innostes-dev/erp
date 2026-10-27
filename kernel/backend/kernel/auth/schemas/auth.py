"""Authentication request and response schemas."""

from pydantic import EmailStr, Field

from kernel.core.schemas import BaseSchema
from kernel.user.models.device import DeviceType
from kernel.user.schemas import UserRead


class LoginRequest(BaseSchema):
    """User login credentials and client hardware context."""

    email: EmailStr = Field(description="Account email address", examples=["admin@example.com"])
    password: str = Field(min_length=1, max_length=128, description="Account password")
    device_fingerprint: str = Field(
        default="browser-client-default",
        description="Unique hardware or browser fingerprint for Zero-Trust verification",
    )
    device_name: str | None = Field(default=None, description="Optional friendly client device name")
    device_type: DeviceType = Field(default=DeviceType.DESKTOP, description="Device form-factor classification")


class TokenResponse(BaseSchema):
    """Successful authentication response containing JWT credentials and user identity."""

    access_token: str = Field(description="Short-lived JWT bearer access token")
    refresh_token: str = Field(description="Long-lived single-use refresh token")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(description="Access token lifespan in seconds")
    must_change_password: bool = Field(description="True if user must reset temporary credentials")
    user: UserRead = Field(description="Authenticated user identity details")


class RefreshTokenRequest(BaseSchema):
    """Payload to rotate a refresh token and obtain a new access token."""

    refresh_token: str = Field(description="Active single-use refresh token")


class RefreshTokenResponse(BaseSchema):
    """New token pair issued following successful refresh token rotation."""

    access_token: str
    refresh_token: str
    token_type: str = Field(default="bearer")
    expires_in: int


class ForgotPasswordRequest(BaseSchema):
    """Initiates an anti-enumeration password reset and temporary password dispatch."""

    email: EmailStr = Field(description="Registered account email address")


class ForgotPasswordResponse(BaseSchema):
    """Generic status response guaranteeing timing and anti-enumeration defense."""

    message: str = Field(
        default="If an account exists with that email address, a password reset link and temporary password have been sent."
    )


class ResetPasswordRequest(BaseSchema):
    """Payload to reset account password using single-use signed reset token."""

    token: str = Field(description="Cryptographically signed single-use reset token from email")
    new_password: str = Field(min_length=8, max_length=128, description="New strong account password")


class ChangePasswordRequest(BaseSchema):
    """Authenticated request to update credentials (or complete first-login reset)."""

    current_password: str = Field(description="Current active or temporary password")
    new_password: str = Field(min_length=8, max_length=128, description="New strong account password")


class LogoutRequest(BaseSchema):
    """Request to revoke session refresh tokens."""

    refresh_token: str | None = Field(default=None, description="Specific session refresh token to revoke")
    logout_all: bool = Field(default=False, description="Whether to revoke all active sessions across all devices")


class MessageResponse(BaseSchema):
    """Standard operation message response."""

    message: str
