# Shared conventions (all backends must follow)

Derived from the FastAPI kernel (`kernel/backend/kernel`). Anything not listed here follows `endpoints.md` and `apps/api-server/openapi.json`.

## Errors
- Body: `{"detail": "<message>", "code": "<machine_code>"}`; `code` omitted when the error has none.
- Validation errors: HTTP 422, body `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`.
- Codes: `invalid_credentials`(401) `account_locked`(401, `Retry-After`) `account_suspended`(403) `temporary_password_expired`(401)
  `device_wiped`(403) `invalid_token`(401) `password_recently_used`(409) `already_installed`(409) `database_unavailable`(503)
  `setup_not_available`(404) `invalid_setup_token`(401, `WWW-Authenticate: SetupToken header="X-Setup-Token"`) `setup_required`(503)
  `tenant_not_found`(404) `slug_taken`(409) `permission_denied` `email_already_exists`(409) `user_not_found`(404) `device_not_found`(404)
- 429 for rate limits, with `Retry-After`.

## Pagination
`{"items": [...], "total": n, "offset": n, "limit": n}`; query `offset>=0` (default 0), `limit` 1..200 (default 50).

## Records
All rows: `id` UUID, `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` (ISO-8601 UTC). Soft delete only; reads hide deleted rows unless stated.

## Tokens
- Access token: JWT HS256 signed with `JWT_SECRET_KEY`. Claims: `sub` (user UUID), `email`, `token_version`, `is_super_admin`, `type:"access"`, `iat`, `exp` (default 30 min).
- Refresh token: opaque `secrets.token_urlsafe(48)`; only its SHA-256 hex is stored in `user_sessions.refresh_token_hash` (7 days). Rotated on every refresh; reuse of a revoked token revokes all of the user's sessions.
- Password-reset token: JWT with `type:"password_reset"`, `sub`, `token_version`, 60 min; single-use via `token_version` bump.
- Access token valid only if the `token_version` claim equals `users.token_version`.
- API key: `inno_live_` + `token_urlsafe(32)`; stored as SHA-256 hex in `api_keys.key_hash`; `key_prefix` = first 14 chars + `...`. Raw key returned once.
- Auth sources, in order: `Authorization: Bearer`, then `access_token` cookie. Login/refresh also set HttpOnly cookies (`access_token` path `/` 900s, `refresh_token` path `/auth` 7d); logout clears them.

## Passwords
- bcrypt (cost 12), `$2b$` prefix. Backends must verify hashes created by any other backend (PHP `$2y$` and `$2b$` are interchangeable).
- 8–128 chars. History: last 5 hashes cannot be reused (409 `password_recently_used`).
- Lockout: `MAX_FAILED_LOGIN_ATTEMPTS`=5 failures sets `blocked_until` now+`ACCOUNT_LOCKOUT_MINUTES`(15). Unknown email still performs a dummy bcrypt verify (timing).
- Forgot-password always returns the same generic message (no enumeration).

## PII encryption
- `email`, `mobile` stored as `email_encrypted`/`mobile_encrypted` using AES-256-GCM envelope: `v<keyVersion>:<base64 12-byte nonce>:<base64 ciphertext||16-byte tag>`; no AAD.
- Key = 32 bytes; config value is 64 hex chars (hex-decoded) otherwise UTF-8 padded/truncated to 32 bytes. `ENCRYPTION_KEYS` = `{version: key}`, `ENCRYPTION_CURRENT_KEY_VERSION`.
- Blind index: `HMAC-SHA256(key=BLIND_INDEX_PEPPER utf-8, msg=trim(lower(value)))` hex, stored in `email_hash` / `mobile_hash` for lookups.
- All backends must read rows written by any other backend.

## Headers
- `X-Tenant-ID` selects the active tenant (UUID); otherwise the user's first active membership, else the oldest tenant.
- `X-Setup-Token` for `/setup` and `/setup/checks`. `X-Forwarded-For` (first entry) is the client IP. `X-Correlation-ID` is stored in audit logs.
- `GET /auth/me` returns `ETag: "<token_version>"` and `304` on matching `If-None-Match`.

## Setup flow
- `/setup/status` public. `/setup` and `/setup/checks` require `X-Setup-Token` (constant-time compare; 10 bad attempts / 15 min / IP → 429). 404 `setup_not_available` once installed or when `SETUP_ENABLED=false`.
- Before installation every other route returns 503 `setup_required` (allowed: `/`, `/health`, `/docs*`, `/redoc`, `/openapi.json`, `/setup*`).
- Install seeds permissions, roles, role-permission grants, tenant, super-admin user, memberships, role assignments, tenant settings (`branding`, `auth`, `localization`), and the singleton `installation` row (see `kernel/backend/kernel/user/services/seeding.py`).

## Authorization
- Tenant module/plugin activation requires `is_super_admin` (403 otherwise).
- Super-admin bypasses RBAC; others resolved through roles → role_permissions (tenant-scoped or global roles, unexpired).

## Database
- PostgreSQL, schema in `schema.sql` (generated from Alembic). Laravel/NestJS migrations must apply that schema, and must no-op when the tables already exist (Alembic- or other backend-created) so one database can be served by any backend.

## Identities and credentials (migration 0010, expand step)
Login identifiers and secrets live in `identities` and `credentials` (schema: `kernel/backend/migrations/sql/0010_identities_credentials.sql`).
Every backend applies that exact file (FastAPI Alembic `0010`, Laravel migration `2026_11_25_000003`, NestJS migrator `0003`);
`node scripts/parity/check-shared-sql.mjs` fails if a copy drifts. The SQL is idempotent and safe on a database migrated by another backend.
- `identities`: `type` in `email|phone|username|social|sso`; email/phone/username store `value_hash` (blind index, same rule as `users.email_hash`) and
  `value_encrypted` (AES-GCM envelope). A value belongs to one account only, including soft-deleted ones. At most one primary identity per type per user.
- `credentials`: `type` in `password|pin|totp|passkey|backup_codes`; at most one active password per user (`uq_credentials_user_password`).
- **Writes:** creating a user adds a primary email identity, a primary phone identity when `mobile` is given, and the password credential.
  Every password change (change, reset, forgot/temp) upserts the credential (`ON CONFLICT (user_id) WHERE type = 'password' AND deleted_at IS NULL`)
  **and** updates `users.password_hash`. The legacy columns `users.email_*`, `mobile_*`, `password_hash` stay written until the contract step.
- **Reads:** look up email/phone through `identities` (active identity, active user), and the password through `credentials`.
  Fall back to the legacy `users` column **only when the new table has no row at all** for that value/user. A soft-deleted identity or
  credential is final: never resolve it through the legacy column, and the backfill never recreates it.
- Blank (whitespace-only) identifiers never match and are never stored.
- A duplicate mobile on user creation is `409 {"detail": "User with this mobile number already exists.", "code": "mobile_already_exists"}`
  on every backend (FastAPI previously returned 500 from the unique index; fixed with this change).
- A user that has no password (credential removed) fails login exactly like a wrong password (dummy bcrypt verify, counted as a failure).

## Environment variables (common)
`DATABASE_URL` (or `DB_*`), `JWT_SECRET_KEY`, `JWT_ALGORITHM`=HS256, `ACCESS_TOKEN_EXPIRE_MINUTES`=30, `REFRESH_TOKEN_EXPIRE_DAYS`=7,
`ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION`, `BLIND_INDEX_PEPPER`, `SETUP_ENABLED`, `SETUP_TOKEN`, `CORS_ORIGINS`,
`FRONTEND_URL`, `SMTP_*`, `MAX_FAILED_LOGIN_ATTEMPTS`, `ACCOUNT_LOCKOUT_MINUTES`, `APP_VERSION`, `APP_ENV`, `PORT`.
Production must refuse to start if `JWT_SECRET_KEY`, encryption keys or pepper are the insecure defaults.

## Known reference quirks (decisions)
| Quirk in FastAPI | Decision for ports |
| --- | --- |
| `/tenants*` list/get/create/update/delete accept anonymous callers (token optional) | Ports **require a valid bearer token** (the spec already documents 401). Parity tests always authenticate. |
| API keys use `current_user.id` as `tenant_id` (no such attribute) | Ports use the active tenant id (`X-Tenant-ID` / default membership). Parity tests do not assert `tenant_id` of keys. |
| ~~`POST /auth/reset-password` calls `AuthService.reset_password`, which does not exist → HTTP 500 for every request~~ **Fixed 2026-11-25** in FastAPI (calls `reset_password_with_token`). | All backends now behave the same; the parity test no longer needs the skip. |
| Failed-login counter, lockout and refresh-reuse revocation are `flush()`ed and then an error is raised, so the request rolls back and **nothing persists** (lockout never triggers; reuse detection does not revoke sibling sessions) | Ports must persist these changes before returning the error (commit, or write outside the rolled-back transaction). Covered by REF_BUG-tagged parity tests. |
| `POST /auth/api-keys` returns 500 (`api_keys.tenant_id` FK receives a user id) | Ports use the active tenant id. Covered by a REF_BUG-tagged parity test. |

> **Note (Laravel agent, 2026-11-24): `api_keys.key_prefix` is too narrow in `schema.sql`.** The column is `VARCHAR(16)` but the
> documented value (`raw_key[:14] + "..."`) is 17 characters, so inserting an API key fails with "value too long" on every
> backend that follows the schema literally (this is the real cause of the FastAPI `POST /auth/api-keys` 500, in addition to the
> `tenant_id` FK issue). The Laravel port ships a second migration that runs
> `ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(32)`. Other backends need the same widening (or equivalent) for the
> REF_BUG API-key parity test to pass; the change is backwards compatible with rows from any backend.

> **Note (NestJS agent, 2026-11-24): deviations implemented by the NestJS port.** Same `key_prefix` widening as above (idempotent `ALTER ... VARCHAR(32)` run on boot/migrate even when the tables pre-exist; stored value is `raw[:14] + "..."`). Additionally: `POST /setup` requires the `admin` object (the reference silently falls back to a built-in default admin/password); a duplicate mobile number is `409 mobile_already_exists` (reference: 500); password change/reset revoke all refresh tokens; malformed JSON is `422 json_invalid`. Note also that the reference never reads `ENCRYPTION_KEYS`/`BLIND_INDEX_PEPPER` from the environment (it always uses its built-in defaults), so ports must default to those same values for cross-backend interoperability in development.

## Unified authorization rules (Laravel and NestJS; supersede the permissive FastAPI behaviour)
Decided after the security reviews (`docs/backend-parity/security/`). FastAPI (reference, unmodified) lets any authenticated caller do all of the following; the parity tests for these rules are tagged `REF_BUG`.

| Operation | Allowed when | Otherwise |
| --- | --- | --- |
| `POST /tenants` | super admin | 403 `permission_denied` |
| `GET /tenants` | super admin: all; others: tenants where they are an active member | empty page |
| `GET /tenants/{id}` | super admin, or active member | 404 `tenant_not_found` |
| `PATCH /tenants/{id}` | super admin, or member whose roles grant `tenancy.tenant.update` | 404 for non-members; 403 `permission_denied` for members without the permission |
| `DELETE /tenants/{id}`, `POST /tenants/{id}/restore` | super admin, or member with `tenancy.tenant.delete` | as above |
| `/tenants/current*` | super admin (any `X-Tenant-ID`, falls back to the oldest tenant), or active member | no membership and no header → 404 `tenant_not_found`; foreign `X-Tenant-ID` → 403 `permission_denied` |
| module/plugin activate/deactivate | super admin | 403 |
| `POST /users` | super admin, or `user.users.create` in the active tenant | 403 `permission_denied` |
| `GET /users/{id}` | self, super admin, or `user.users.read` in a tenant shared with the target | 404 `user_not_found` |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `DELETE /auth/api-keys/{id}` | tenant context required (404 `tenant_not_found` otherwise); users list/revoke their own keys, super admins and `tenancy.members.manage` holders all keys of the tenant; invisible key → 404; **an API-key principal cannot create or revoke API keys (403)** | |

Other decisions: the client IP is taken from `X-Forwarded-For` only through the configured trusted-proxy setting (`TRUSTED_PROXIES` / `TRUST_PROXY`), never unconditionally. New passwords (create user, change/reset password, setup admin) are rejected with 422 above 72 bytes (bcrypt limit); login accepts up to 128 characters. The `token_version` claim is mandatory in access tokens.
