# Release notes: Multi-backend kernel (Unreleased)

Date: 2026-11-24. No version tag has been assigned yet.

## What's new

The platform kernel now ships with three interchangeable backends:

| Backend | Location | Dev port | Container port |
| --- | --- | --- | --- |
| FastAPI / Python (default, unmodified reference) | `kernel/backend` + `apps/api-server` | 8001 | 8001 |
| Laravel 12 / PHP 8.2 | `kernel/backend-laravel` | 8002 | 8000 |
| NestJS 11 / Node 22 | `kernel/backend-nestjs` | 8003 | 8001 |

- All three serve the same 31 kernel operations ([`endpoints.md`](../backend-parity/endpoints.md)) against the same PostgreSQL schema ([`schema.sql`](../backend-parity/schema.sql)) and API contract (`apps/api-server/openapi.json`), with the same token and crypto formats ([`conventions.md`](../backend-parity/conventions.md)). The web-app works unchanged against any of them.
- Docker: `docker-compose.backends.yml` overlay with profiles `laravel` and `nestjs`.
- Nx projects `kernel-backend-laravel` and `kernel-backend-nestjs` (targets: `install`, `serve`, `migrate`, `openapi`, `lint`, `test`; NestJS also `build` and `typecheck`).
- Backend-agnostic parity suite (`tests/parity`) and OpenAPI gap report (`scripts/parity/gap-report.mjs`).
- New documentation: [`docs/backends/README.md`](README.md).

## Compatibility

- Scope is the kernel only. PeopleOps, SalesFlow and Tracura remain FastAPI-only; the Laravel and NestJS backends do not serve them.
- An existing database can be switched between backends when they share `JWT_SECRET_KEY`, `ENCRYPTION_KEYS` and `BLIND_INDEX_PEPPER`. Tokens, bcrypt hashes and encrypted PII interoperate.
- The FastAPI backend is unchanged and remains the default.

## Deviations from the FastAPI reference

The ports intentionally do not replicate these reference defects:

- `POST /auth/reset-password` returns 500 on FastAPI; the ports implement it.
- Failed-login counters, lockout and refresh-token reuse revocation are rolled back with the 401 on FastAPI; the ports persist them.
- Tenant, user and API-key routes are effectively unauthorized on FastAPI (`/tenants*` even accept anonymous callers; any authenticated user can rename or delete any tenant and read any user's decrypted email). The ports enforce tenant-scoped, permission-based authorization ([rules](../backend-parity/conventions.md#unified-authorization-rules-laravel-and-nestjs-supersede-the-permissive-fastapi-behaviour)). **Recommended: apply the same rules to the FastAPI reference.**
- `POST /auth/api-keys` returns 500 on FastAPI (user id used as tenant id, and `api_keys.key_prefix` is `VARCHAR(16)` for a 17-character value); the ports use the active tenant and widen the column to `VARCHAR(32)`.

Other deviations: `POST /setup` requires the `admin` object (the reference falls back to a default admin); a duplicate mobile number returns 409 (reference: 500). See the table in [`README.md`](README.md#8-differences-from-the-fastapi-reference).

## Known limitations

- MFA and an audit read API are not implemented in the ports.
- `/redoc` is not served by NestJS (use `/docs`); `/metrics` is not provided by Laravel.
- Rate-limit and setup-throttle stores are per process unless a shared store is configured (Laravel: `CACHE_STORE=redis`; NestJS: bring your own store).
- Passwords are limited to 72 bytes on creation/change in the ports (bcrypt limit); FastAPI silently truncates.

## Upgrade and migration notes

- Existing FastAPI deployments need no action.
- To move an existing database to Laravel or NestJS, follow [Switching backends](README.md#7-switching-backends-on-one-database). Their migrators are no-ops when the tables exist; both widen `api_keys.key_prefix` (idempotent).

## Security notes

- **The FastAPI reference does not read `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` or `BLIND_INDEX_PEPPER` from the environment** (`Settings.load()` in `kernel/backend/kernel/core/config/settings.py`). FastAPI deployments therefore use the built-in development keys. Laravel and NestJS read them from the environment and refuse to boot in production with the defaults.
- Operators switching an existing FastAPI database to another backend must keep the development keys until the data is re-encrypted; no re-encryption tool is provided.
- Recommended follow-up (not done here): make the FastAPI reference read these variables.
