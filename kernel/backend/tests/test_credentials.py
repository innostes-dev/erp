"""Identities + credentials (migration 0010): lookup order, legacy fallback, no-resurrection rule,
dual writes, and how login / password flows use them. Mostly negative and breaking scenarios.

The database-level behaviour (constraints, backfill, all three backends on one database) is covered by
`tests/parity/identities.test.mjs`; these tests pin the FastAPI service logic without a database.
"""

from collections.abc import Callable
from pathlib import Path
import re
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from sqlalchemy.dialects import postgresql

from kernel.auth.schemas import ChangePasswordRequest, ForgotPasswordRequest, LoginRequest
from kernel.auth.services import AuthService, InMemoryEmailService, InvalidCredentialsError
from kernel.core.crypto import BlindIndex, FieldCipher
from kernel.user.models.credentials import Credential, CredentialType, Identity, IdentityType
from kernel.user.models.user import User, UserStatus
from kernel.user.schemas import UserCreate
from kernel.user.services import CredentialService, DeviceService, UserService, hash_password, verify_password

REPO = Path(__file__).resolve().parents[3]
SHARED_SQL = REPO / "kernel/backend/migrations/sql/0010_identities_credentials.sql"


def sql_of(stmt) -> str:
    """Render a statement as PostgreSQL SQL (literal values inlined) for routing and assertions."""
    try:
        return str(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))
    except Exception:  # some statements (e.g. UUID literals) can't inline: fall back to bound form
        return str(stmt.compile(dialect=postgresql.dialect()))


class RoutingSession:
    """Fake AsyncSession: each executed statement is answered by the first matching route.

    A route is (predicate on the SQL text, scalar value). Unmatched statements return None / [].
    Every SQL string is recorded in `executed` so tests can assert what did (not) run.
    """

    def __init__(self, routes: list[tuple[Callable[[str], bool], object]] | None = None) -> None:
        self.routes = routes or []
        self.executed: list[str] = []
        self.added: list[object] = []
        self.flush = AsyncMock()
        self.refresh = AsyncMock()

    def add(self, obj: object) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        self.added.append(obj)

    async def execute(self, stmt):
        sql = sql_of(stmt)
        self.executed.append(sql)
        value = next((v for match, v in self.routes if match(sql)), None)
        res = MagicMock()
        res.scalar_one_or_none.return_value = value
        res.scalars.return_value.all.return_value = [] if value is None else [value]
        return res


def has(*parts: str) -> Callable[[str], bool]:
    """Predicate: every fragment appears in the SQL (case-insensitive, whitespace-collapsed)."""
    return lambda sql: all(p.lower() in " ".join(sql.split()).lower() for p in parts)


IDENTITY_JOIN = has("join identities")
IDENTITY_EXISTS = has("select identities.id", "from identities")
def _legacy(column: str) -> Callable[[str], bool]:
    # the identity JOIN query also lists users.* columns, so match on the WHERE clause and exclude the join
    return lambda sql: "join identities" not in sql.lower() and f"where users.{column} =" in " ".join(sql.split()).lower()


LEGACY_EMAIL = _legacy("email_hash")
LEGACY_MOBILE = _legacy("mobile_hash")
ACTIVE_PASSWORD = has("select credentials.secret_hash", "credentials.deleted_at is null")
ANY_PASSWORD = has("select credentials.id", "from credentials")


class CredentialServiceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.cipher = FieldCipher(keyring={1: b"01234567890123456789012345678901"}, current_version=1)
        self.blind_index = BlindIndex(pepper="test-pepper-secret")
        self.svc = CredentialService(cipher=self.cipher, blind_index=self.blind_index)
        self.user = User(
            id=uuid.uuid4(), first_name="A", email_hash="h", email_encrypted="e",
            password_hash=hash_password("Legacy-Passw0rd!"), status=UserStatus.ACTIVE,
        )

    # ---- find_user_by_identifier ------------------------------------

    async def test_active_identity_wins_and_skips_legacy(self) -> None:
        session = RoutingSession([(IDENTITY_JOIN, self.user)])
        found = await self.svc.find_user_by_identifier(session, IdentityType.EMAIL, "a@example.com")
        self.assertIs(found, self.user)
        self.assertEqual(len(session.executed), 1, "no fallback query once the identity matched")

    async def test_lookup_excludes_deleted_identity_and_deleted_user(self) -> None:
        session = RoutingSession()
        await self.svc.find_user_by_identifier(session, IdentityType.EMAIL, "a@example.com")
        join_sql = " ".join(session.executed[0].split()).lower()
        self.assertIn("identities.deleted_at is null", join_sql)
        self.assertIn("users.deleted_at is null", join_sql)
        self.assertIn("identities.type = 'email'", join_sql)

    async def test_falls_back_to_legacy_column_when_no_identity_row_exists(self) -> None:
        session = RoutingSession([(LEGACY_EMAIL, self.user)])
        found = await self.svc.find_user_by_identifier(session, IdentityType.EMAIL, "a@example.com")
        self.assertIs(found, self.user)
        self.assertTrue(any(LEGACY_EMAIL(s) for s in session.executed))

    async def test_soft_deleted_identity_is_never_resurrected_through_legacy(self) -> None:
        session = RoutingSession([(IDENTITY_EXISTS, uuid.uuid4()), (LEGACY_EMAIL, self.user)])
        found = await self.svc.find_user_by_identifier(session, IdentityType.EMAIL, "a@example.com")
        self.assertIsNone(found)
        self.assertFalse(any(LEGACY_EMAIL(s) for s in session.executed), "legacy column must not be consulted")

    async def test_phone_falls_back_to_mobile_hash(self) -> None:
        session = RoutingSession([(LEGACY_MOBILE, self.user)])
        found = await self.svc.find_user_by_identifier(session, IdentityType.PHONE, "+911234567890")
        self.assertIs(found, self.user)

    async def test_username_has_no_legacy_column(self) -> None:
        session = RoutingSession([(LEGACY_EMAIL, self.user), (LEGACY_MOBILE, self.user)])
        self.assertIsNone(await self.svc.find_user_by_identifier(session, IdentityType.USERNAME, "ada"))

    async def test_blank_identifier_runs_no_query(self) -> None:
        session = RoutingSession([(IDENTITY_JOIN, self.user)])
        for blank in ("", "   "):
            self.assertIsNone(await self.svc.find_user_by_identifier(session, IdentityType.EMAIL, blank))
        self.assertEqual(session.executed, [])

    async def test_lookup_is_case_and_whitespace_insensitive(self) -> None:
        a = self.blind_index.compute("Ada@Example.com")
        b = self.blind_index.compute("  ada@example.COM ")
        self.assertEqual(a, b)

    # ---- passwords ---------------------------------------------------

    async def test_active_credential_wins_over_legacy_column(self) -> None:
        cred_hash = hash_password("Credential-Passw0rd!")
        session = RoutingSession([(ACTIVE_PASSWORD, cred_hash)])
        self.assertEqual(await self.svc.get_password_hash(session, self.user), cred_hash)

    async def test_removed_password_is_not_resurrected_through_legacy(self) -> None:
        session = RoutingSession([(ANY_PASSWORD, uuid.uuid4())])
        self.assertIsNone(await self.svc.get_password_hash(session, self.user))

    async def test_legacy_password_used_only_when_no_credential_row_exists(self) -> None:
        session = RoutingSession()
        self.assertEqual(await self.svc.get_password_hash(session, self.user), self.user.password_hash)
        self.user.password_hash = ""
        self.assertIsNone(await self.svc.get_password_hash(RoutingSession(), self.user))

    async def test_empty_credential_hash_is_not_treated_as_a_password(self) -> None:
        session = RoutingSession([(ACTIVE_PASSWORD, ""), (ANY_PASSWORD, uuid.uuid4())])
        self.assertIsNone(await self.svc.get_password_hash(session, self.user))

    async def test_set_password_upserts_on_the_partial_unique_index_and_mirrors_legacy(self) -> None:
        session = RoutingSession()
        new_hash = hash_password("Brand-New-Passw0rd!")
        actor = uuid.uuid4()
        await self.svc.set_password_hash(session, self.user, new_hash, actor_id=actor)
        sql = " ".join(session.executed[0].split()).lower()
        self.assertTrue(sql.startswith("insert into credentials"))
        self.assertIn("on conflict (user_id) where type = 'password' and deleted_at is null do update", sql)
        self.assertIn(f"do update set secret_hash = '{new_hash.lower()}', updated_at = now()", sql)
        self.assertEqual(self.user.password_hash, new_hash, "legacy column must stay in sync")

    # ---- builders ----------------------------------------------------

    def test_new_identity_encrypts_value_and_indexes_it(self) -> None:
        ident = self.svc.new_identity(self.user.id, IdentityType.EMAIL, "Ada@Example.com", is_primary=True)
        self.assertEqual(ident.type, "email")
        self.assertTrue(ident.is_primary)
        self.assertEqual(ident.value_hash, self.blind_index.compute("ada@example.com"))
        self.assertEqual(self.cipher.decrypt(ident.value_encrypted), "Ada@Example.com")
        self.assertNotIn("Ada", ident.value_encrypted, "plaintext must not be stored")

    def test_new_identity_rejects_blank_values(self) -> None:
        for blank in ("", "  "):
            with self.assertRaises(ValueError):
                self.svc.new_identity(self.user.id, IdentityType.PHONE, blank)


class UserServiceWritesTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        cipher = FieldCipher(keyring={1: b"01234567890123456789012345678901"}, current_version=1)
        self.users = UserService(cipher=cipher, blind_index=BlindIndex(pepper="test-pepper-secret"))

    async def _create(self, mobile: str | None):
        session = RoutingSession()
        data = UserCreate(first_name="Ada", email="ada@example.com", password="Initial-Passw0rd!", mobile=mobile)
        user = await self.users.create_user(session, data)
        return user, session

    async def test_create_writes_primary_email_identity_and_password_credential(self) -> None:
        user, session = await self._create(mobile=None)
        idents = [o for o in session.added if isinstance(o, Identity)]
        creds = [o for o in session.added if isinstance(o, Credential)]
        self.assertEqual([(i.type, i.is_primary) for i in idents], [("email", True)], "no phone identity without mobile")
        self.assertEqual(idents[0].value_hash, user.email_hash)
        self.assertEqual(len(creds), 1)
        self.assertEqual(creds[0].type, CredentialType.PASSWORD.value)
        self.assertEqual(creds[0].secret_hash, user.password_hash, "credential and legacy column hold the same hash")
        self.assertTrue(all(o.user_id == user.id for o in idents + creds))

    async def test_create_with_mobile_also_writes_primary_phone_identity(self) -> None:
        user, session = await self._create(mobile="+911234567890")
        phones = [o for o in session.added if isinstance(o, Identity) and o.type == "phone"]
        self.assertEqual(len(phones), 1)
        self.assertTrue(phones[0].is_primary)
        self.assertEqual(phones[0].value_hash, user.mobile_hash)

    async def test_duplicate_email_is_rejected_before_any_row_is_written(self) -> None:
        existing = User(id=uuid.uuid4(), first_name="X", email_hash="h", email_encrypted="e", password_hash="p")
        session = RoutingSession([(IDENTITY_JOIN, existing)])
        from kernel.user.services import EmailAlreadyExistsError

        with self.assertRaises(EmailAlreadyExistsError):
            await self.users.create_user(session, UserCreate(first_name="A", email="ADA@example.com", password="Initial-Passw0rd!"))
        self.assertEqual(session.added, [], "nothing may be written for a duplicate")


class DuplicateMobileTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        cipher = FieldCipher(keyring={1: b"01234567890123456789012345678901"}, current_version=1)
        self.users = UserService(cipher=cipher, blind_index=BlindIndex(pepper="test-pepper-secret"))
        self.data = UserCreate(first_name="A", email="new@example.com", password="Initial-Passw0rd!", mobile="+911234567890")

    async def test_mobile_taken_by_a_user_row_is_a_409_and_writes_nothing(self) -> None:
        from kernel.user.services import MobileAlreadyExistsError

        session = RoutingSession([(has("select users.id", "where users.mobile_hash ="), uuid.uuid4())])
        with self.assertRaises(MobileAlreadyExistsError) as ctx:
            await self.users.create_user(session, self.data)
        self.assertEqual(ctx.exception.code, "mobile_already_exists")
        self.assertEqual(session.added, [])

    async def test_mobile_taken_only_by_a_phone_identity_is_also_a_409(self) -> None:
        from kernel.user.services import MobileAlreadyExistsError

        session = RoutingSession([(has("select identities.id", "identities.type = 'phone'"), uuid.uuid4())])
        with self.assertRaises(MobileAlreadyExistsError):
            await self.users.create_user(session, self.data)
        self.assertEqual(session.added, [])

    async def test_free_mobile_is_accepted(self) -> None:
        session = RoutingSession()
        user = await self.users.create_user(session, self.data)
        self.assertIsNotNone(user.mobile_hash)


class AuthFlowsUseCredentialsTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        cipher = FieldCipher(keyring={1: b"01234567890123456789012345678901"}, current_version=1)
        blind = BlindIndex(pepper="test-pepper-secret")
        self.users = UserService(cipher=cipher, blind_index=blind)
        self.email = InMemoryEmailService()
        self.auth = AuthService(user_service=self.users, device_service=DeviceService(), email_service=self.email, blind_index=blind)
        self.user = User(
            id=uuid.uuid4(), first_name="Ada", email_hash=blind.compute("ada@example.com"),
            email_encrypted=cipher.encrypt("ada@example.com"), password_hash=hash_password("Legacy-Passw0rd!"),
            status=UserStatus.ACTIVE, failed_login_attempts=0, token_version=1, is_super_admin=False,
            must_change_password=False,
        )

    def _login(self, password: str) -> LoginRequest:
        return LoginRequest(email="ada@example.com", password=password, device_fingerprint="fp-test-device-0001")

    async def test_login_uses_credential_not_stale_legacy_column(self) -> None:
        cred = hash_password("Credential-Passw0rd!")
        session = RoutingSession([(IDENTITY_JOIN, self.user), (ACTIVE_PASSWORD, cred)])
        ok = await self.auth.login(session, self._login("Credential-Passw0rd!"))
        self.assertTrue(ok.access_token)

        session = RoutingSession([(IDENTITY_JOIN, self.user), (ACTIVE_PASSWORD, cred)])
        with self.assertRaises(InvalidCredentialsError):
            await self.auth.login(session, self._login("Legacy-Passw0rd!"))
        self.assertEqual(self.user.failed_login_attempts, 1, "a wrong password is counted")

    async def test_login_without_any_password_fails_and_still_spends_hashing_time(self) -> None:
        session = RoutingSession([(IDENTITY_JOIN, self.user), (ANY_PASSWORD, uuid.uuid4())])
        with patch("kernel.auth.services.auth_service.verify_password", wraps=verify_password) as spy:
            with self.assertRaises(InvalidCredentialsError):
                await self.auth.login(session, self._login("Legacy-Passw0rd!"))
        self.assertEqual(spy.call_count, 1, "dummy bcrypt verify keeps timing equal to a wrong password")
        self.assertEqual(self.user.failed_login_attempts, 1)

    async def test_login_rejects_removed_email_identity(self) -> None:
        session = RoutingSession([(IDENTITY_EXISTS, uuid.uuid4()), (LEGACY_EMAIL, self.user)])
        with self.assertRaises(InvalidCredentialsError):
            await self.auth.login(session, self._login("Legacy-Passw0rd!"))

    async def test_change_password_checks_current_password_against_credential(self) -> None:
        cred = hash_password("Credential-Passw0rd!")
        session = RoutingSession([(has("from users", "users.id"), self.user), (ACTIVE_PASSWORD, cred)])
        with self.assertRaises(InvalidCredentialsError):
            await self.auth.change_password(
                session, self.user.id,
                ChangePasswordRequest(current_password="Legacy-Passw0rd!", new_password="Another-Passw0rd!1"),
            )
        self.assertFalse(any(s.lower().startswith("insert into credentials") for s in session.executed))

    async def test_change_password_with_no_password_is_rejected(self) -> None:
        session = RoutingSession([(has("from users", "users.id"), self.user), (ANY_PASSWORD, uuid.uuid4())])
        with self.assertRaises(InvalidCredentialsError):
            await self.auth.change_password(
                session, self.user.id,
                ChangePasswordRequest(current_password="Legacy-Passw0rd!", new_password="Another-Passw0rd!1"),
            )

    async def test_change_password_writes_credential_and_legacy_column(self) -> None:
        session = RoutingSession([(has("from users", "users.id"), self.user)])
        await self.auth.change_password(
            session, self.user.id,
            ChangePasswordRequest(current_password="Legacy-Passw0rd!", new_password="Another-Passw0rd!1"),
        )
        upserts = [s for s in session.executed if s.lower().startswith("insert into credentials")]
        self.assertEqual(len(upserts), 1)
        self.assertTrue(verify_password("Another-Passw0rd!1", self.user.password_hash))

    async def test_forgot_password_replaces_credential_with_temp_password(self) -> None:
        session = RoutingSession([(IDENTITY_JOIN, self.user)])
        old = self.user.password_hash
        await self.auth.forgot_password(session, ForgotPasswordRequest(email="ada@example.com"))
        upserts = [s for s in session.executed if s.lower().startswith("insert into credentials")]
        self.assertEqual(len(upserts), 1, "temp password must reach the credentials table")
        self.assertNotEqual(self.user.password_hash, old)
        self.assertTrue(self.user.must_change_password)

    async def test_forgot_password_for_removed_identity_sends_nothing(self) -> None:
        session = RoutingSession([(IDENTITY_EXISTS, uuid.uuid4()), (LEGACY_EMAIL, self.user)])
        await self.auth.forgot_password(session, ForgotPasswordRequest(email="ada@example.com"))
        self.assertEqual(self.email.sent_emails, [])
        self.assertFalse(any(s.lower().startswith("insert into credentials") for s in session.executed))


class MigrationSqlTests(unittest.TestCase):
    """The shared SQL file: how Alembic splits it, and that every backend applies the same text."""

    def test_alembic_splits_into_single_statements_without_comments(self) -> None:
        import importlib.util

        path = REPO / "kernel/backend/migrations/versions/0010_identities_and_credentials.py"
        spec = importlib.util.spec_from_file_location("m0010", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)  # type: ignore[union-attr]
        stmts = module._statements(SHARED_SQL.read_text(encoding="utf-8"))
        kinds = [s.split()[0] + " " + s.split()[1] for s in stmts]
        self.assertEqual(kinds.count("CREATE TABLE"), 2)
        self.assertEqual(kinds.count("INSERT INTO"), 3)
        self.assertEqual(len(stmts), 2 + 3 + 9, "2 tables, 9 indexes, 3 backfills")
        for s in stmts:
            self.assertNotIn(";", s)
            self.assertFalse(s.lstrip().startswith("--"))

    def test_sql_is_idempotent_by_construction(self) -> None:
        sql = SHARED_SQL.read_text(encoding="utf-8")
        for create in re.findall(r"^CREATE [^\n]*", sql, flags=re.M):
            self.assertIn("IF NOT EXISTS", create, create)
        self.assertEqual(sql.count("INSERT INTO"), sql.count("AND NOT EXISTS"), "every backfill is guarded")

    def test_backfill_never_resurrects_soft_deleted_rows(self) -> None:
        sql = SHARED_SQL.read_text(encoding="utf-8")
        # the guards must look at ALL rows (no "deleted_at IS NULL" inside the NOT EXISTS checks)
        for guard in re.findall(r"AND NOT EXISTS \((.*?)\);", sql, flags=re.S):
            self.assertNotIn("deleted_at", guard)
        self.assertIn("i.user_id = u.id", sql, "users that already have an identity of that type are skipped")

    def test_laravel_and_nestjs_apply_the_identical_sql(self) -> None:
        canonical = SHARED_SQL.read_text(encoding="utf-8")
        laravel = (REPO / "kernel/backend-laravel/database/schema/0010_identities_credentials.sql").read_text(encoding="utf-8")
        self.assertEqual(laravel, canonical, "run: cp kernel/backend/migrations/sql/0010_identities_credentials.sql kernel/backend-laravel/database/schema/")
        ts = (REPO / "kernel/backend-nestjs/src/migrations/0003-identities-credentials.ts").read_text(encoding="utf-8")
        match = re.search(r"= `(.*)`;\n$", ts, flags=re.S)
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), canonical, "run: node kernel/backend-nestjs/scripts/gen-schema.js")


if __name__ == "__main__":
    unittest.main()
