"""
Email service abstraction layer.

Supports multiple backends:
  - console: Logs emails to stdout (default for development)
  - smtp: Sends via SMTP server
  - sendgrid: Sends via SendGrid API

Configure via environment variables:
  EMAIL_BACKEND=console|smtp|sendgrid
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  SENDGRID_API_KEY, SENDGRID_FROM
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: str
    subject: str
    body_text: str
    body_html: Optional[str] = None
    from_address: Optional[str] = None


class EmailBackend(ABC):
    @abstractmethod
    async def send(self, message: EmailMessage) -> bool:
        """Send an email. Returns True on success."""
        ...


class ConsoleEmailBackend(EmailBackend):
    """Logs emails to console. Used for development."""

    async def send(self, message: EmailMessage) -> bool:
        logger.info(
            f"[EMAIL] To: {message.to} | Subject: {message.subject}\n"
            f"Body: {message.body_text[:200]}"
        )
        print(f"\n{'='*50}")
        print(f"EMAIL TO: {message.to}")
        print(f"SUBJECT: {message.subject}")
        print(f"BODY:\n{message.body_text}")
        print(f"{'='*50}\n")
        return True


class SMTPEmailBackend(EmailBackend):
    """Sends emails via SMTP."""

    async def send(self, message: EmailMessage) -> bool:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = message.subject
        msg["From"] = message.from_address or settings.SMTP_FROM
        msg["To"] = message.to

        msg.attach(MIMEText(message.body_text, "plain"))
        if message.body_html:
            msg.attach(MIMEText(message.body_html, "html"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASS,
                use_tls=True,
            )
            return True
        except Exception as e:
            logger.error(f"SMTP send failed: {e}")
            return False


class SendGridEmailBackend(EmailBackend):
    """Sends emails via SendGrid API."""

    async def send(self, message: EmailMessage) -> bool:
        try:
            import httpx
        except ImportError:
            logger.error("httpx not installed for SendGrid backend")
            return False

        from_addr = message.from_address or settings.SENDGRID_FROM
        payload = {
            "personalizations": [{"to": [{"email": message.to}]}],
            "from": {"email": from_addr},
            "subject": message.subject,
            "content": [{"type": "text/plain", "value": message.body_text}],
        }
        if message.body_html:
            payload["content"].append({"type": "text/html", "value": message.body_html})

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}"},
                )
                return resp.status_code in (200, 202)
        except Exception as e:
            logger.error(f"SendGrid send failed: {e}")
            return False


def _get_backend() -> EmailBackend:
    backend = getattr(settings, "EMAIL_BACKEND", "console").lower()
    if backend == "smtp":
        return SMTPEmailBackend()
    elif backend == "sendgrid":
        return SendGridEmailBackend()
    return ConsoleEmailBackend()


class EmailService:
    """High-level email service with template methods."""

    def __init__(self):
        self._backend = _get_backend()

    async def send(self, message: EmailMessage) -> bool:
        return await self._backend.send(message)

    async def send_invite(self, to: str, name: str, temp_password: str, org_name: str = "FedKnowledge") -> bool:
        return await self.send(EmailMessage(
            to=to,
            subject=f"You've been invited to {org_name}",
            body_text=(
                f"Hi {name},\n\n"
                f"You've been invited to join {org_name}.\n\n"
                f"Your temporary password is: {temp_password}\n\n"
                f"Please log in and change your password.\n\n"
                f"— The {org_name} Team"
            ),
        ))

    async def send_password_reset(self, to: str, name: str, reset_token: str, reset_url: str = "") -> bool:
        link = f"{reset_url}?token={reset_token}" if reset_url else f"Reset token: {reset_token}"
        return await self.send(EmailMessage(
            to=to,
            subject="Password Reset Request",
            body_text=(
                f"Hi {name},\n\n"
                f"We received a password reset request for your account.\n\n"
                f"{link}\n\n"
                f"This link expires in 1 hour. If you didn't request this, ignore this email.\n"
            ),
        ))

    async def send_mfa_backup_codes(self, to: str, name: str, codes: list[str]) -> bool:
        codes_text = "\n".join(f"  - {code}" for code in codes)
        return await self.send(EmailMessage(
            to=to,
            subject="Your MFA Backup Codes",
            body_text=(
                f"Hi {name},\n\n"
                f"Here are your MFA backup codes. Store them in a safe place:\n\n"
                f"{codes_text}\n\n"
                f"Each code can only be used once.\n"
            ),
        ))

    async def send_access_request_notification(self, to: str, admin_name: str, requester_name: str, department: str) -> bool:
        return await self.send(EmailMessage(
            to=to,
            subject=f"Access Request from {requester_name}",
            body_text=(
                f"Hi {admin_name},\n\n"
                f"{requester_name} has requested access to the {department} department.\n\n"
                f"Please review this request in the admin panel.\n"
            ),
        ))


# Singleton instance
email_service = EmailService()
