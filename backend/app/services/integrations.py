"""
Integration service stubs.

These are interface definitions for enterprise integrations that require
external service setup. Each class defines the contract for the integration
and provides a no-op implementation that can be swapped for real implementations.

Planned integrations:
  - SSO/SAML (Okta, Azure AD)
  - Slack notifications
  - Microsoft Teams notifications
  - Virus/malware scanning
  - Azure AD user sync
  - Google Drive / SharePoint document import
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


# ============================================================
# SSO / SAML Integration
# ============================================================

@dataclass
class SSOUser:
    email: str
    first_name: str
    last_name: str
    groups: list[str] = field(default_factory=list)
    provider_id: str = ""


class SSOProvider(ABC):
    """Base class for SSO/SAML identity providers."""

    @abstractmethod
    async def get_login_url(self, redirect_uri: str) -> str:
        """Return the SSO login URL for redirect."""
        ...

    @abstractmethod
    async def validate_callback(self, code: str) -> Optional[SSOUser]:
        """Validate the SSO callback and return user info."""
        ...

    @abstractmethod
    async def logout_url(self, redirect_uri: str) -> str:
        """Return the SSO logout URL."""
        ...


class OktaSSOProvider(SSOProvider):
    """Okta SAML/OIDC integration stub."""

    async def get_login_url(self, redirect_uri: str) -> str:
        logger.warning("Okta SSO not configured — returning stub URL")
        return f"/app/login?sso=okta&redirect={redirect_uri}"

    async def validate_callback(self, code: str) -> Optional[SSOUser]:
        logger.warning("Okta SSO callback not implemented")
        return None

    async def logout_url(self, redirect_uri: str) -> str:
        return redirect_uri


class AzureADSSOProvider(SSOProvider):
    """Azure AD SAML/OIDC integration stub."""

    async def get_login_url(self, redirect_uri: str) -> str:
        logger.warning("Azure AD SSO not configured — returning stub URL")
        return f"/app/login?sso=azuread&redirect={redirect_uri}"

    async def validate_callback(self, code: str) -> Optional[SSOUser]:
        logger.warning("Azure AD SSO callback not implemented")
        return None

    async def logout_url(self, redirect_uri: str) -> str:
        return redirect_uri


# ============================================================
# Slack Integration
# ============================================================

@dataclass
class SlackMessage:
    channel: str
    text: str
    blocks: Optional[list[dict]] = None


class SlackIntegration(ABC):
    """Base class for Slack bot integration."""

    @abstractmethod
    async def send_message(self, message: SlackMessage) -> bool:
        ...

    @abstractmethod
    async def send_notification(self, channel: str, title: str, body: str) -> bool:
        ...


class SlackIntegrationStub(SlackIntegration):
    """No-op Slack integration for development."""

    async def send_message(self, message: SlackMessage) -> bool:
        logger.info(f"[SLACK STUB] #{message.channel}: {message.text[:100]}")
        return True

    async def send_notification(self, channel: str, title: str, body: str) -> bool:
        logger.info(f"[SLACK STUB] Notification to #{channel}: {title}")
        return True


# ============================================================
# Microsoft Teams Integration
# ============================================================

@dataclass
class TeamsMessage:
    webhook_url: str
    title: str
    text: str
    color: str = "0076D7"


class TeamsIntegration(ABC):
    """Base class for Microsoft Teams integration via webhooks."""

    @abstractmethod
    async def send_card(self, message: TeamsMessage) -> bool:
        ...

    @abstractmethod
    async def send_notification(self, webhook_url: str, title: str, body: str) -> bool:
        ...


class TeamsIntegrationStub(TeamsIntegration):
    """No-op Teams integration for development."""

    async def send_card(self, message: TeamsMessage) -> bool:
        logger.info(f"[TEAMS STUB] Card: {message.title}")
        return True

    async def send_notification(self, webhook_url: str, title: str, body: str) -> bool:
        logger.info(f"[TEAMS STUB] Notification: {title}")
        return True


# ============================================================
# Virus / Malware Scanning
# ============================================================

@dataclass
class ScanResult:
    is_clean: bool
    threat_name: Optional[str] = None
    scanner: str = "none"


class VirusScanner(ABC):
    """Base class for file virus scanning."""

    @abstractmethod
    async def scan_file(self, file_path: str) -> ScanResult:
        ...

    @abstractmethod
    async def scan_bytes(self, data: bytes, filename: str = "") -> ScanResult:
        ...


class VirusScannerStub(VirusScanner):
    """No-op scanner — always returns clean. Replace with ClamAV or external scan."""

    async def scan_file(self, file_path: str) -> ScanResult:
        logger.info(f"[SCAN STUB] File scan skipped: {file_path}")
        return ScanResult(is_clean=True, scanner="stub")

    async def scan_bytes(self, data: bytes, filename: str = "") -> ScanResult:
        logger.info(f"[SCAN STUB] Bytes scan skipped: {filename} ({len(data)} bytes)")
        return ScanResult(is_clean=True, scanner="stub")


class ClamAVScanner(VirusScanner):
    """ClamAV integration stub — requires clamd running."""

    async def scan_file(self, file_path: str) -> ScanResult:
        try:
            import clamd
            cd = clamd.ClamdUnixSocket()
            result = cd.scan(file_path)
            if result:
                path_result = result.get(file_path)
                if path_result and path_result[0] == "FOUND":
                    return ScanResult(is_clean=False, threat_name=path_result[1], scanner="clamav")
            return ScanResult(is_clean=True, scanner="clamav")
        except ImportError:
            logger.warning("clamd not installed — skipping virus scan")
            return ScanResult(is_clean=True, scanner="clamav-unavailable")
        except Exception as e:
            logger.error(f"ClamAV scan error: {e}")
            return ScanResult(is_clean=True, scanner="clamav-error")

    async def scan_bytes(self, data: bytes, filename: str = "") -> ScanResult:
        try:
            import clamd
            import io
            cd = clamd.ClamdUnixSocket()
            result = cd.instream(io.BytesIO(data))
            if result:
                stream_result = result.get("stream")
                if stream_result and stream_result[0] == "FOUND":
                    return ScanResult(is_clean=False, threat_name=stream_result[1], scanner="clamav")
            return ScanResult(is_clean=True, scanner="clamav")
        except ImportError:
            logger.warning("clamd not installed — skipping virus scan")
            return ScanResult(is_clean=True, scanner="clamav-unavailable")
        except Exception as e:
            logger.error(f"ClamAV stream scan error: {e}")
            return ScanResult(is_clean=True, scanner="clamav-error")


# ============================================================
# Azure AD User Sync
# ============================================================

class AzureADSync(ABC):
    """Base class for Azure AD user directory sync."""

    @abstractmethod
    async def sync_users(self, department_id: str) -> dict:
        """Sync users from Azure AD. Returns {created, updated, deactivated}."""
        ...

    @abstractmethod
    async def get_groups(self) -> list[dict]:
        """List Azure AD groups."""
        ...


class AzureADSyncStub(AzureADSync):
    """No-op Azure AD sync."""

    async def sync_users(self, department_id: str) -> dict:
        logger.info(f"[AZURE AD STUB] User sync skipped for department {department_id}")
        return {"created": 0, "updated": 0, "deactivated": 0}

    async def get_groups(self) -> list[dict]:
        logger.info("[AZURE AD STUB] Group list not available")
        return []


# ============================================================
# Document Import (Google Drive, SharePoint)
# ============================================================

@dataclass
class ImportedDocument:
    name: str
    content: bytes
    mime_type: str
    source_url: str


class DocumentImporter(ABC):
    """Base class for external document import."""

    @abstractmethod
    async def list_files(self, folder_id: str = "") -> list[dict]:
        """List files in a folder."""
        ...

    @abstractmethod
    async def import_file(self, file_id: str) -> Optional[ImportedDocument]:
        """Import a file by ID."""
        ...


class GoogleDriveImporterStub(DocumentImporter):
    """No-op Google Drive importer."""

    async def list_files(self, folder_id: str = "") -> list[dict]:
        logger.info("[GDRIVE STUB] File listing not available")
        return []

    async def import_file(self, file_id: str) -> Optional[ImportedDocument]:
        logger.info(f"[GDRIVE STUB] Import not available for: {file_id}")
        return None


class SharePointImporterStub(DocumentImporter):
    """No-op SharePoint importer."""

    async def list_files(self, folder_id: str = "") -> list[dict]:
        logger.info("[SHAREPOINT STUB] File listing not available")
        return []

    async def import_file(self, file_id: str) -> Optional[ImportedDocument]:
        logger.info(f"[SHAREPOINT STUB] Import not available for: {file_id}")
        return None


# ============================================================
# Factory / Registry
# ============================================================

class IntegrationRegistry:
    """Central registry for all integration services."""

    def __init__(self):
        self.sso: SSOProvider = OktaSSOProvider()
        self.slack: SlackIntegration = SlackIntegrationStub()
        self.teams: TeamsIntegration = TeamsIntegrationStub()
        self.virus_scanner: VirusScanner = VirusScannerStub()
        self.azure_ad_sync: AzureADSync = AzureADSyncStub()
        self.gdrive_importer: DocumentImporter = GoogleDriveImporterStub()
        self.sharepoint_importer: DocumentImporter = SharePointImporterStub()

    def configure_sso(self, provider: str = "okta"):
        if provider == "azuread":
            self.sso = AzureADSSOProvider()
        else:
            self.sso = OktaSSOProvider()

    def configure_virus_scanner(self, scanner: str = "stub"):
        if scanner == "clamav":
            self.virus_scanner = ClamAVScanner()
        else:
            self.virus_scanner = VirusScannerStub()


# Singleton instance
integrations = IntegrationRegistry()
