"""Authentication request and response schemas."""

from pydantic import EmailStr, Field

from kernel.core.schemas import BaseSchema
from kernel.user.models.device import DeviceType
from kernel.user.schemas import UserRead


class LoginRequest(BaseSchema):
    """User login credentials and client hardware context."""

    email: EmailStr = Field(
        description="Registered user account email address.",
        examples=["priya.shah@northwind.example"],
    )
    password: str = Field(
        min_length=1,
        max_length=128,
        description="Account authentication password.",
        examples=["NorthwindPass2026!"],
    )
    device_fingerprint: str = Field(
        default="browser-client-default",
        description="Unique hardware or browser fingerprint for Zero-Trust verification.",
        examples=["fp_7a9f1c3e8b2d4a6e"],
    )
    device_name: str | None = Field(
        default=None,
        description="Optional human-readable client device label.",
        examples=["Bengaluru Office MacBook Pro"],
    )
    device_type: DeviceType = Field(
        default=DeviceType.DESKTOP,
        description="Form-factor classification of client hardware.",
        examples=[DeviceType.DESKTOP],
    )


class TokenResponse(BaseSchema):
    """Successful authentication response containing JWT credentials and user identity."""

    access_token: str = Field(
        description="Short-lived JWT bearer access token valid for 30 minutes.",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjJiMWM5ZS01ZDhhLTRmNmItOWMyZS0xYTNiNWM3ZDllMGYiLCJleHAiOjE3NjE3NDAwMDB9.sample_signature"],
    )
    refresh_token: str = Field(
        description="Long-lived single-use rotating refresh token valid for 7 days.",
        examples=["rt_8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d"],
    )
    token_type: str = Field(
        default="bearer",
        description="HTTP authorization scheme type.",
        examples=["bearer"],
    )
    expires_in: int = Field(
        description="Access token lifespan in seconds (1800 seconds).",
        examples=[1800],
    )
    must_change_password: bool = Field(
        description="Flag indicating whether user must change temporary credentials before continuing.",
        examples=[False],
    )
    user: UserRead = Field(
        description="Authenticated user identity and profile summary.",
        examples=[{"id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f", "email": "priya.shah@northwind.example"}],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjJiMWM5ZS01ZDhhLTRmNmItOWMyZS0xYTNiNWM3ZDllMGYiLCJleHAiOjE3NjE3NDAwMDB9.sample_signature",
                    "refresh_token": "rt_8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
                    "token_type": "bearer",
                    "expires_in": 1800,
                    "must_change_password": False,
                    "user": {
                        "id": "3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f",
                        "first_name": "Priya",
                        "last_name": "Shah",
                        "email": "priya.shah@northwind.example",
                        "mobile": "+919876543210",
                        "status": "active",
                        "is_super_admin": True,
                        "token_version": 1,
                        "created_at": "2026-10-29T10:00:00Z",
                        "created_by": None,
                        "updated_at": "2026-10-29T10:00:00Z",
                        "updated_by": None,
                        "deleted_at": None,
                        "deleted_by": None,
                    },
                }
            ]
        }
    }


class RefreshTokenRequest(BaseSchema):
    """Payload to rotate a refresh token and obtain a new access token."""

    refresh_token: str = Field(
        description="Active single-use rotating refresh token.",
        examples=["rt_8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d"],
    )


class RefreshTokenResponse(BaseSchema):
    """New token pair issued following successful refresh token rotation."""

    access_token: str = Field(
        description="Newly minted short-lived JWT bearer access token.",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjJiMWM5ZS01ZDhhLTRmNmItOWMyZS0xYTNiNWM3ZDllMGYiLCJleHAiOjE3NjE3NDAwMDB9.new_sample_signature"],
    )
    refresh_token: str = Field(
        description="Freshly rotated single-use refresh token.",
        examples=["rt_9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d"],
    )
    token_type: str = Field(
        default="bearer",
        description="HTTP authorization scheme type.",
        examples=["bearer"],
    )
    expires_in: int = Field(
        description="Access token lifespan in seconds (1800 seconds).",
        examples=[1800],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjJiMWM5ZS01ZDhhLTRmNmItOWMyZS0xYTNiNWM3ZDllMGYiLCJleHAiOjE3NjE3NDAwMDB9.new_sample_signature",
                    "refresh_token": "rt_9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
                    "token_type": "bearer",
                    "expires_in": 1800,
                }
            ]
        }
    }


class ForgotPasswordRequest(BaseSchema):
    """Initiates an anti-enumeration password reset and temporary password dispatch."""

    email: EmailStr = Field(
        description="Registered user account email address.",
        examples=["priya.shah@northwind.example"],
    )


class ForgotPasswordResponse(BaseSchema):
    """Generic status response guaranteeing timing and anti-enumeration defense."""

    message: str = Field(
        default="If an account exists with that email address, a password reset link and temporary password have been sent.",
        description="Anti-enumeration confirmation notice.",
        examples=["If an account exists with that email address, a password reset link and temporary password have been sent."],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "If an account exists with that email address, a password reset link and temporary password have been sent."
                }
            ]
        }
    }


class ResetPasswordRequest(BaseSchema):
    """Payload to reset account password using single-use signed reset token."""

    token: str = Field(
        description="Cryptographically signed single-use reset token delivered via email.",
        examples=["rst_4f8e2a1b9c3d7e5f6a0b8c2d4e6f1a3b"],
    )
    new_password: str = Field(
        min_length=8,
        max_length=128,
        description="New strong account password complying with complexity rules.",
        examples=["NewPermanentPassword2026!"],
    )


class ChangePasswordRequest(BaseSchema):
    """Authenticated request to update credentials (or complete first-login reset)."""

    current_password: str = Field(
        description="Current active password or temporary one-time password.",
        examples=["NorthwindPass2026!"],
    )
    new_password: str = Field(
        min_length=8,
        max_length=128,
        description="New strong account password complying with complexity rules.",
        examples=["NewPermanentPassword2026!"],
    )


class LogoutRequest(BaseSchema):
    """Request to revoke session refresh tokens."""

    refresh_token: str | None = Field(
        default=None,
        description="Specific session refresh token to revoke. When omitted, active cookie is revoked.",
        examples=["rt_8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d"],
    )
    logout_all: bool = Field(
        default=False,
        description="Whether to revoke all active sessions across all client devices.",
        examples=[False],
    )


class MessageResponse(BaseSchema):
    """Standard operation message response."""

    message: str = Field(
        description="Human-readable operational status message.",
        examples=["Operation completed successfully."],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Operation completed successfully."
                }
            ]
        }
    }
