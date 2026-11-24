"""First-run setup: detect whether the system is installed and install it once."""

from datetime import datetime, timezone
import logging
import uuid

from sqlalchemy import exists, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from kernel.core.database.connection import get_engine, ping_db
from kernel.core.database.migrations import pending_migrations, run_migrations
from kernel.core.services import (
    ConflictError,
    ErrorCode,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
)
from kernel.setup.models import Installation
from kernel.setup.schemas import SetupChecks, SetupRequest, SetupResult, SetupStatus
from kernel.tenancy import Tenant, TenantRead, TenantService
from kernel.tenancy.models.tenant_member import TenantMember, TenantMemberStatus
from kernel.user.schemas import UserRead
from kernel.user.services import (
    RBACService,
    UserService,
    seed_default_permissions_and_roles,
    seed_default_tenant_settings,
)

logger = logging.getLogger("kernel.setup")


class AlreadyInstalledError(ConflictError):
    """Setup was already completed; it can only run once."""

    code = ErrorCode.ALREADY_INSTALLED

    def __init__(self) -> None:
        super().__init__("Setup has already been completed")


class DatabaseUnavailableError(ServiceUnavailableError):
    """The database can't be reached, so the setup state is unknown."""

    code = ErrorCode.DATABASE_UNAVAILABLE

    def __init__(self) -> None:
        super().__init__("Cannot connect to the database")


class SetupNotAvailableError(NotFoundError):
    """Setup is finished or web setup is disabled: the route behaves as if it didn't exist."""

    code = ErrorCode.SETUP_NOT_AVAILABLE

    def __init__(self) -> None:
        super().__init__("Not Found")


class InvalidSetupTokenError(UnauthorizedError):
    """The `X-Setup-Token` header is missing or wrong."""

    code = ErrorCode.INVALID_SETUP_TOKEN

    def __init__(self) -> None:
        super().__init__(
            "Missing or invalid setup token",
            headers={"WWW-Authenticate": 'SetupToken header="X-Setup-Token"'},
        )


class SetupRequiredError(ServiceUnavailableError):
    """The system is not installed yet, so normal API routes are unavailable."""

    code = ErrorCode.SETUP_REQUIRED

    def __init__(self) -> None:
        super().__init__("Setup has not been completed")


async def installation_exists(engine: AsyncEngine | None = None) -> bool:
    """Return True if the `installation` row exists (setup is complete).

    Uses its own short-lived connection, so no lock is held afterwards. A
    database without the `installation` table (fresh database) counts as
    not installed.
    """
    async with (engine or get_engine()).connect() as conn:
        has_table = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).has_table(Installation.__tablename__)
        )
        if not has_table:
            return False
        result = await conn.execute(select(exists().where(Installation.singleton.is_(True))))
        return bool(result.scalar())


class SetupService:
    """Checks and performs the one-time installation of this ERP instance."""

    def __init__(
        self,
        session: AsyncSession,
        app_version: str,
        engine: AsyncEngine | None = None,
    ) -> None:
        self.session = session
        self.app_version = app_version
        self._engine = engine

    @property
    def engine(self) -> AsyncEngine:
        """The engine used for diagnostics (lazily the shared kernel engine)."""
        if self._engine is None:
            self._engine = get_engine()
        return self._engine

    # ---- checks --------------------------------------------------------

    async def database_connected(self) -> bool:
        """Return True if the database answers a `SELECT 1`."""
        report = await ping_db(timeout=3.0)
        return report.get("status") == "HEALTHY"

    async def is_installed(self) -> bool:
        """Return True once setup has been completed.

        Uses its own short-lived connection, so no lock on `installation` is
        held while migrations run. A database without the `installation`
        table (fresh database) counts as not installed.
        """
        return await installation_exists(self.engine)

    async def status(self) -> SetupStatus:
        """Public setup status: only whether the system is installed."""
        if not await self.database_connected():
            raise DatabaseUnavailableError()
        return SetupStatus(installed=await self.is_installed())

    async def checks(self) -> SetupChecks:
        """Pre-install diagnostics for the wizard (token holders only)."""
        if not await self.database_connected():
            raise DatabaseUnavailableError()
        pending = await pending_migrations(self.engine)
        return SetupChecks(database_connected=True, migrations_pending=len(pending))

    # ---- install -------------------------------------------------------

    async def install(self, data: SetupRequest, actor_id: uuid.UUID | None = None) -> SetupResult:
        """Install the system: create tables, the first tenant and the installation row.

        The tenant and the installation row are written in the request
        transaction, so a failure leaves nothing half-installed. Migrations
        run first and are safe to run again.
        """
        if not await self.database_connected():
            raise DatabaseUnavailableError()
        if await self.is_installed():
            raise AlreadyInstalledError()

        logger.info("Running first-run setup: applying migrations")
        await run_migrations()

        try:
            tenant = await TenantService(self.session).create(data.organization, actor_id)
            user_service = UserService()
            admin = await user_service.create_user(session=self.session, data=data.admin, is_super_admin=True)
            await self._make_owner(tenant.id, admin.id)
            await self._seed_settings(tenant, data)

            installation = Installation(
                app_version=self.app_version,
                default_tenant_id=tenant.id,
                created_by=actor_id or admin.id,
                updated_by=actor_id or admin.id,
            )
            self.session.add(installation)
            await self.session.flush()
        except IntegrityError as exc:
            # Another setup request won the race (same slug or the singleton row).
            raise AlreadyInstalledError() from exc
        await self.session.refresh(installation)

        logger.info("First-run setup completed for tenant %r with admin %r", tenant.slug, data.admin.email)
        return SetupResult(
            tenant=TenantRead.model_validate(tenant),
            admin=user_service.to_user_read(admin),
            installed_at=installation.created_at,
        )

    async def _make_owner(self, tenant_id: uuid.UUID, admin_id: uuid.UUID) -> None:
        """Make the admin an active member of the tenant, a global super admin and the tenant's owner."""
        self.session.add(
            TenantMember(
                tenant_id=tenant_id,
                user_id=admin_id,
                status=TenantMemberStatus.ACTIVE,
                joined_at=datetime.now(timezone.utc),
            )
        )
        roles = await seed_default_permissions_and_roles(self.session)
        rbac = RBACService()
        for code, role_tenant in (("super_admin", None), ("owner", tenant_id)):
            if code in roles:
                await rbac.assign_role_to_user(
                    session=self.session,
                    user_id=admin_id,
                    role_id=roles[code].id,
                    tenant_id=role_tenant,
                    assigned_by=admin_id,
                )

    async def _seed_settings(self, tenant: Tenant, data: SetupRequest) -> None:
        await seed_default_tenant_settings(
            session=self.session,
            tenant_id=tenant.id,
            organization_name=tenant.name,
            branding_input=data.branding.model_dump() if data.branding else None,
            timezone=tenant.timezone or "UTC",
            language=tenant.language or "en-US",
            date_format=tenant.date_format or "YYYY-MM-DD",
        )
