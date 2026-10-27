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
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
)
from kernel.setup.models import Installation
from kernel.setup.schemas import SetupChecks, SetupRequest, SetupResult, SetupStatus
from kernel.tenancy import TenantRead, TenantService
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

    def __init__(self) -> None:
        """Create the error with a fixed, client-safe message."""
        super().__init__("Setup has already been completed")


class DatabaseUnavailableError(ServiceUnavailableError):
    """The database can't be reached, so the setup state is unknown."""

    code = "database_unavailable"

    def __init__(self) -> None:
        """Create the error with a fixed, client-safe message."""
        super().__init__("Cannot connect to the database")


class SetupNotAvailableError(NotFoundError):
    """Setup is finished or web setup is disabled: the route behaves as if it didn't exist."""

    def __init__(self) -> None:
        """Create the error with the same message as any unknown route."""
        super().__init__("Not Found")


class InvalidSetupTokenError(UnauthorizedError):
    """The `X-Setup-Token` header is missing or wrong."""

    code = "invalid_setup_token"

    def __init__(self) -> None:
        """Create the error; tells clients which header to send."""
        super().__init__(
            "Missing or invalid setup token",
            headers={"WWW-Authenticate": 'SetupToken header="X-Setup-Token"'},
        )


class SetupRequiredError(ServiceUnavailableError):
    """The system is not installed yet, so normal API routes are unavailable."""

    code = "setup_required"

    def __init__(self) -> None:
        """Create the error with a fixed, client-safe message."""
        super().__init__("Setup has not been completed")


async def installation_exists(engine: AsyncEngine | None = None) -> bool:
    """Return True if the `installation` row exists (setup is complete).

    Uses its own short-lived connection, so no lock is held afterwards. A
    database without the `installation` table (fresh database) counts as
    not installed.

    Args:
        engine: Engine to use; defaults to the kernel's shared engine.

    Raises:
        Exception: Database errors propagate; an unreachable database must
            never be mistaken for "not installed".
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
    """Checks and performs the one-time installation of this ERP instance.

    Attributes:
        session: Request-scoped database session (committed by `get_db`).
        app_version: Version recorded in the installation row.
    """

    def __init__(
        self,
        session: AsyncSession,
        app_version: str,
        engine: AsyncEngine | None = None,
    ) -> None:
        """Create the service.

        Args:
            session: Database session used for reads and the install writes.
            app_version: API version to record in the installation row.
            engine: Engine for connection checks and migrations; defaults to
                the kernel's shared engine.
        """
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

        Raises:
            Exception: Database errors propagate; an unreachable database
                must never be mistaken for "not installed".
        """
        return await installation_exists(self.engine)

    async def status(self) -> SetupStatus:
        """Public setup status: only whether the system is installed.

        Returns:
            The installed flag.

        Raises:
            DatabaseUnavailableError: The database can't be reached, so it is
                unknown whether the system is installed.
        """
        if not await self.database_connected():
            raise DatabaseUnavailableError()
        return SetupStatus(installed=await self.is_installed())

    async def checks(self) -> SetupChecks:
        """Pre-install diagnostics for the wizard (token holders only).

        Returns:
            Whether the database is reachable and how many migrations are pending.

        Raises:
            DatabaseUnavailableError: The database can't be reached.
        """
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

        Args:
            data: Values collected by the setup wizard.
            actor_id: User performing setup, if known (None on first run).

        Returns:
            The created tenant and the install time.

        Raises:
            AlreadyInstalledError: Setup was already completed, including when
                another request completed it at the same moment.
            SlugTakenError: The organisation slug is already used.
            DatabaseUnavailableError: The database can't be reached.
        """
        if not await self.database_connected():
            raise DatabaseUnavailableError()
        if await self.is_installed():
            raise AlreadyInstalledError()

        logger.info("Running first-run setup: applying migrations")
        await run_migrations()

        try:
            # 1. Create tenant
            tenant = await TenantService(self.session).create(data.organization, actor_id)

            # 2. Create super admin user
            user_svc = UserService()
            admin_user = await user_svc.create_user(
                session=self.session,
                data=data.admin,
                is_super_admin=True,
            )

            # 3. Associate admin with tenant as active member
            member = TenantMember(
                tenant_id=tenant.id,
                user_id=admin_user.id,
                status=TenantMemberStatus.ACTIVE,
                joined_at=datetime.now(timezone.utc),
            )
            self.session.add(member)

            # 4. Seed system RBAC permissions and default roles
            roles = await seed_default_permissions_and_roles(self.session)

            # 5. Assign roles: global super_admin & tenant owner
            rbac_svc = RBACService()
            if "super_admin" in roles:
                await rbac_svc.assign_role_to_user(
                    session=self.session,
                    user_id=admin_user.id,
                    role_id=roles["super_admin"].id,
                    tenant_id=None,
                    assigned_by=admin_user.id,
                )
            if "owner" in roles:
                await rbac_svc.assign_role_to_user(
                    session=self.session,
                    user_id=admin_user.id,
                    role_id=roles["owner"].id,
                    tenant_id=tenant.id,
                    assigned_by=admin_user.id,
                )

            # 6. Seed tenant modular settings (branding, auth, localization)
            branding_dict = data.branding.model_dump() if data.branding else None
            await seed_default_tenant_settings(
                session=self.session,
                tenant_id=tenant.id,
                organization_name=tenant.name,
                branding_input=branding_dict,
                timezone=tenant.timezone or "UTC",
                language=tenant.language or "en-US",
                date_format=tenant.date_format or "YYYY-MM-DD",
            )

            # 7. Record installation singleton row
            effective_actor = actor_id or admin_user.id
            installation = Installation(
                app_version=self.app_version,
                default_tenant_id=tenant.id,
                created_by=effective_actor,
                updated_by=effective_actor,
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
            admin=user_svc.to_user_read(admin_user),
            installed_at=installation.created_at,
        )
