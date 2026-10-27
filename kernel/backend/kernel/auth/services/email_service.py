"""Enterprise Email & Notification service for transactional authentication events."""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
import email.message
import logging
import smtplib

from kernel.core.config import get_settings

logger = logging.getLogger("kernel.auth.email")


@dataclass
class SentEmail:
    """Record of an email dispatched by the service."""

    recipient: str
    subject: str
    text_body: str
    html_body: str | None
    sent_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EmailService:
    """Base interface for dispatching transactional emails."""

    async def send_email(
        self,
        recipient: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
    ) -> bool:
        raise NotImplementedError

    async def send_password_reset_email(
        self,
        recipient: str,
        recipient_name: str,
        temp_password: str,
        reset_link: str,
        temp_password_hours: int = 24,
        reset_link_minutes: int = 60,
    ) -> bool:
        """Render and dispatch password reset notification with temporary credentials and reset link."""
        subject = "Your Innostes ERP Temporary Password & Password Reset Link"

        text_body = f"""Hello {recipient_name},

A password reset was requested for your Innostes ERP account.

1. TEMPORARY PASSWORD (valid for {temp_password_hours} hours):
   {temp_password}
   You can use this password to log in directly. You will be required to set a new password upon login.

2. OR SET A NEW PASSWORD IMMEDIATELY (valid for {reset_link_minutes} minutes):
   {reset_link}

SECURITY NOTICE:
If you did not request this password reset, please contact your security administrator immediately.

--
Innostes ERP Security Team
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #2563eb; color: #ffffff; padding: 24px; text-align: center; }}
    .content {{ padding: 32px; }}
    .card {{ background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #2563eb; }}
    .code {{ font-family: monospace; font-size: 18px; font-weight: bold; color: #1e293b; letter-spacing: 1px; }}
    .button {{ display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0; }}
    .footer {{ padding: 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">Innostes ERP Security</h2>
    </div>
    <div class="content">
      <p>Hello <strong>{recipient_name}</strong>,</p>
      <p>A password reset was requested for your Innostes ERP account.</p>

      <div class="card">
        <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600;">Temporary Password</div>
        <div class="code" style="margin-top: 6px;">{temp_password}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Valid for {temp_password_hours} hours. You will be asked to choose a new password on login.</div>
      </div>

      <p>Alternatively, click the button below to choose a new password immediately:</p>
      <div style="text-align: center;">
        <a href="{reset_link}" class="button" target="_blank">Reset Password Now &rarr;</a>
      </div>
      <p style="font-size: 13px; color: #64748b; text-align: center;">This link is valid for {reset_link_minutes} minutes.</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
      <p style="font-size: 12px; color: #ef4444; margin: 0;">
        <strong>Security Notice:</strong> If you did not initiate this request, someone may be trying to access your account. Please notify your administrator immediately.
      </p>
    </div>
    <div class="footer">
      Sent automatically by Innostes ERP Platform.
    </div>
  </div>
</body>
</html>
"""
        return await self.send_email(
            recipient=recipient,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
        )


class InMemoryEmailService(EmailService):
    """Stores dispatched emails in memory and logs them. Used for development and testing."""

    def __init__(self) -> None:
        self.sent_emails: list[SentEmail] = []

    async def send_email(
        self,
        recipient: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
    ) -> bool:
        record = SentEmail(
            recipient=recipient,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
        )
        self.sent_emails.append(record)

        logger.info(
            "\n" + "=" * 65 + "\n"
            f"[EMAIL DISPATCHED] To: {recipient}\n"
            f"Subject: {subject}\n"
            f"Body:\n{text_body.strip()}\n"
            + "=" * 65
        )
        return True


class SMTPEmailService(EmailService):
    """Production SMTP client dispatching emails asynchronously via background thread."""

    def __init__(
        self,
        host: str,
        port: int = 587,
        username: str | None = None,
        password: str | None = None,
        from_address: str = "noreply@innostes.com",
        use_tls: bool = True,
    ) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.from_address = from_address
        self.use_tls = use_tls

    async def send_email(
        self,
        recipient: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
    ) -> bool:
        return await asyncio.to_thread(
            self._send_sync,
            recipient,
            subject,
            text_body,
            html_body,
        )

    def _send_sync(
        self,
        recipient: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
    ) -> bool:
        msg = email.message.EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.from_address
        msg["To"] = recipient
        msg.set_content(text_body)

        if html_body:
            msg.add_alternative(html_body, subtype="html")

        try:
            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
            logger.info("Successfully sent email to %s via SMTP (%s)", recipient, self.host)
            return True
        except Exception as exc:
            logger.error("Failed to deliver email to %s: %s", recipient, exc)
            return False


# Global default in-memory email service for tests and dev
_default_email_service: InMemoryEmailService = InMemoryEmailService()


def get_email_service() -> EmailService:
    """Return configured email service instance based on environment settings."""
    settings = get_settings()
    if settings.smtp_host:
        password = settings.smtp_password.get_secret_value() if settings.smtp_password else None
        return SMTPEmailService(
            host=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=password,
            from_address=settings.smtp_from,
            use_tls=settings.smtp_use_tls,
        )
    return _default_email_service
