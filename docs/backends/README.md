# Multi-backend kernel guide

The platform kernel ships with **three interchangeable backends**. They serve the same 31 kernel operations, use the same PostgreSQL schema, the same API contract and the same token and crypto formats, so the web-app works unchanged against any of them.

- Operations: [`docs/backend-parity/endpoints.md`](../backend-parity/endpoints.md)
- Schema: [`docs/backend-parity/schema.sql`](../backend-parity/schema.sql)
- Contract: [`apps/api-server/openapi.json`](../../apps/api-server/openapi.json)
- Tokens, crypto, errors, setup flow: [`docs/backend-parity/conventions.md`](../backend-parity/conventions.md)
- Release notes: [`release-notes.md`](release-notes.md)

> **Scope: kernel only.** Business modules (PeopleOps, SalesFlow) and plugins (Tracura) are still FastAPI-only. The Laravel and NestJS backends do not serve them.

## 1. Overview

| | FastAPI (default) | Laravel | NestJS |
| --- | --- | --- | --- |
| Location | `kernel/backend` + `apps/api-server` | `kernel/backend-laravel` | `kernel/backend-nestjs` |
| Stack | Python 3.12+, FastAPI, Uvicorn | PHP 8.2+, Laravel 12 | Node 22, NestJS 11 (Express 5), TypeScript |
| Dev port | 8001 | 8002 (Nx `serve`) | 8003 (parity-suite convention; default `PORT` is 8001) |
| Container port | 8001 (`PORT`) | 8000 (nginx + php-fpm) | 8001 (`PORT`) |
| DB access layer | Alembic migrations (SQLAlchemy models) | Laravel migrations applying `database/schema/kernel.sql` | `pg` with hand-written parameterised SQL, built-in migrator |
| DB settings | `DATABASE_URL` | `DB_*` (see its README) | `DATABASE_URL` |
| Rate limiting | Setup-token throttling is in-process | Laravel cache (`CACHE_STORE`; use `redis` for multiple instances) | `@nestjs/throttler`, per-process store |
| Tests | `pnpm nx test kernel-backend` / `pnpm nx test api-server` | `composer test` (Nx: `kernel-backend-laravel:test`) | `npm test && npm run test:e2e` (Nx: `kernel-backend-nestjs:test`) |
| Lint | n/a (no lint target in the Nx project) | `composer lint` and `composer analyse` (Nx: `kernel-backend-laravel:lint`) | `npm run lint`, `npm run typecheck` (Nx: `kernel-backend-nestjs:lint`, `:typecheck`) |
| Detail | [`apps/api-server/README.md`](../../apps/api-server/README.md) | [`kernel/backend-laravel/README.md`](../../kernel/backend-laravel/README.md) | [`kernel/backend-nestjs/README.md`](../../kernel/backend-nestjs/README.md) |

FastAPI is the unmodified reference implementation and the default in `docker-compose.yml`.

## 2. Choosing a backend

- Need PeopleOps, SalesFlow or Tracura: use **FastAPI**. It is the only backend that serves them.
- Kernel-only deployment (auth, tenants, users, setup) on a PHP or Node stack: **Laravel** or **NestJS**.
- Unsure: stay on FastAPI. The ports intentionally fix several reference defects (section 8) and omit a few features (section 8), so check that table first.

## 3. Run each backend locally

All backends need PostgreSQL 14+ (the repo compose file starts 16): `docker compose up -d db`.

### FastAPI (default, port 8001)

```bash
pnpm install
pnpm nx run api-server:install
cp .env.example .env
pnpm nx run kernel-backend:migrate
pnpm nx serve api-server
```

### Laravel (dev port 8002)

Requires PHP 8.2+ (`pdo_pgsql`, `openssl`, `mbstring`) and Composer.

```bash
pnpm nx run kernel-backend-laravel:install     # composer install
cd kernel/backend-laravel && cp .env.example .env && php artisan key:generate && cd -
pnpm nx run kernel-backend-laravel:migrate     # php artisan migrate --force
pnpm nx run kernel-backend-laravel:serve       # php artisan serve --port=8002
```

### NestJS (dev port 8003)

Requires Node 22. The package is self-contained (own `package-lock.json`, installed with npm, not through the pnpm workspace).

```bash
pnpm nx run kernel-backend-nestjs:install      # npm ci
cp kernel/backend-nestjs/.env.example kernel/backend-nestjs/.env   # set PORT=8003 and DATABASE_URL
pnpm nx run kernel-backend-nestjs:build
pnpm nx run kernel-backend-nestjs:migrate      # npm run migrate
pnpm nx run kernel-backend-nestjs:serve        # npm run start:dev
```

The `.env.example` default `PORT` is 8001; set `PORT=8003` to avoid clashing with FastAPI. To point the web-app at a different backend, change its API base URL to that backend's port.

Other Nx targets: `kernel-backend-laravel:openapi`, `kernel-backend-nestjs:openapi` (regenerate each backend's `openapi.json`).

## 4. Run with Docker

`docker-compose.yml` runs PostgreSQL and FastAPI. The overlay `docker-compose.backends.yml` adds profiles `laravel` and `nestjs`. Pick **one** backend; each publishes `${PORT:-8001}` on the host.

```bash
docker compose up                                                                                   # FastAPI (default)
docker compose -f docker-compose.yml -f docker-compose.backends.yml --profile laravel up db api-laravel
docker compose -f docker-compose.yml -f docker-compose.backends.yml --profile nestjs  up db api-nestjs
```

Container ports: Laravel listens on 8000, NestJS and FastAPI on 8001. The host mapping is `${PORT:-8001}`. The overlay defaults `APP_ENV` to `development`. Set real secrets for production (the Laravel and NestJS backends refuse to boot in production with default secrets).

Per-backend Docker builds (standalone images) are described in each backend README.

## 5. Environment variables

Common set (full list per backend: `.env.example` in `kernel/backend-laravel` and `kernel/backend-nestjs`, root `.env.example` for FastAPI):

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `production` enables the secure-configuration check in Laravel and NestJS |
| `PORT` | Listen port (FastAPI, NestJS; Laravel's `php artisan serve` takes `--port`) |
| `DATABASE_URL` | PostgreSQL URL (FastAPI, NestJS). **Laravel uses `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`** (the compose overlay maps them) |
| `JWT_SECRET_KEY` | HS256 signing key (>= 32 chars, unique, in production) |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Token lifetimes (30 min / 7 days) |
| `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` | AES-256-GCM keys for PII (email, mobile) |
| `BLIND_INDEX_PEPPER` | HMAC pepper for the email/mobile blind indexes |
| `SETUP_ENABLED`, `SETUP_TOKEN`, `SETUP_TOKEN_FILE` | First-run setup (section 6) |
| `CORS_ORIGINS`, `FRONTEND_URL` | Web-app origin |
| `MAX_FAILED_LOGIN_ATTEMPTS`, `ACCOUNT_LOCKOUT_MINUTES` | Lockout policy (5 / 15) |
| `SMTP_*` | Outgoing mail |

Backend-specific: Laravel has `APP_KEY` (framework internals only, tokens use `JWT_SECRET_KEY`), `TRUSTED_PROXIES`, `CACHE_STORE`, `RUN_MIGRATIONS` (Docker). NestJS has `TRUST_PROXY`, `AUTO_MIGRATE`, `DB_POOL_SIZE`, `METRICS_ENABLED`. FastAPI has `AUTO_MIGRATE`.

> **Security: FastAPI ignores `ENCRYPTION_KEYS` and `BLIND_INDEX_PEPPER`.**
> `Settings.load()` in `kernel/backend/kernel/core/config/settings.py` reads `JWT_SECRET_KEY` and other settings from the environment, but not `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` or `BLIND_INDEX_PEPPER`. FastAPI deployments therefore always use the built-in development keys, whatever you set. The Laravel and NestJS backends read these from the environment and refuse to boot in production with the defaults. The development defaults of the ports equal the FastAPI built-ins on purpose, so a local database works across backends. A follow-up fix to the reference (reading these variables) is recommended; it has not been made.

## 6. First-run setup

On a fresh database every route except `/`, `/health`, `/docs*`, `/openapi.json` and `/setup*` answers `503 {"code":"setup_required"}`.

1. Start the backend with `SETUP_ENABLED=true` and a `SETUP_TOKEN` (if none is set, a token is generated into `SETUP_TOKEN_FILE` where supported; see the backend README).
2. `GET /setup/status` (public).
3. `POST /setup` with header `X-Setup-Token: <token>` and the setup body. The `admin` object is required on Laravel and NestJS.
4. After installation `/setup*` answers `404 setup_not_available`. Wrong tokens are throttled (10 attempts per 15 minutes per IP, then 429).

Details: [`setup-api-architecture.md`](../setup-api-architecture.md).

## 7. Switching backends on one database

The schema is shared, and the Laravel and NestJS migrators are no-ops when the tables already exist, so an existing database can be served by any backend. Requirements:

- The same `JWT_SECRET_KEY` (otherwise all tokens become invalid).
- The same `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` and `BLIND_INDEX_PEPPER` (otherwise encrypted email/mobile cannot be decrypted and logins by email fail).
- Run only one backend at a time per database unless you know they are configured identically.

Caveats:

- **FastAPI to Laravel/NestJS:** FastAPI used the built-in development keys (section 5). Set `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` and `BLIND_INDEX_PEPPER` to the development defaults (see the `.env.example` files) until the data is re-encrypted. Production mode in the ports refuses these defaults, so a production switch of an existing FastAPI database needs a re-encryption plan first (not provided).
- Laravel and NestJS widen `api_keys.key_prefix` from `VARCHAR(16)` to `VARCHAR(32)`; this is idempotent and backwards compatible.
- Passwords (bcrypt `$2a$/$2b$/$2y$`), refresh tokens (SHA-256) and encrypted envelopes interoperate in both directions; each port ships interop tests against the Python reference.
- Business-module tables are managed only by FastAPI (Alembic).

## 8. Differences from the FastAPI reference

The ports are behaviourally identical except where the reference is defective or underspecified. Source: `conventions.md` ("Known reference quirks" and the appended notes) and each backend README.

| Area | FastAPI reference | Laravel / NestJS |
| --- | --- | --- |
| `POST /auth/reset-password` | 500 (calls a missing method) | Implemented |
| Failed-login counter, lockout, refresh-reuse revocation | Rolled back with the 401, never persisted | Committed before the 401 |
| Tenant, user and API-key authorization | Any authenticated caller (tenants: even anonymous callers) can list, change and delete every tenant and read any user | Role/permission based and tenant-scoped: see [Unified authorization rules](../backend-parity/conventions.md#unified-authorization-rules-laravel-and-nestjs-supersede-the-permissive-fastapi-behaviour) |
| Client IP (`X-Forwarded-For`) | First entry trusted unconditionally | Honoured only via the trusted-proxy setting (`TRUSTED_PROXIES` / `TRUST_PROXY`) |
| New password length | 8–128 characters | 8–128 characters and at most 72 bytes (422 above); login accepts up to 128 |
| `POST /auth/api-keys` | 500 (user id used as tenant id; `key_prefix` is `VARCHAR(16)`) | Uses the active tenant; column widened to 32 |
| `POST /setup` without `admin` | Creates a default admin with a published password | `admin` required (422) |
| Duplicate mobile number | 500 | 409 `mobile_already_exists` |
| Password change/reset | Not documented | NestJS revokes all refresh tokens |
| `/auth/refresh` body | `refresh_token` required | Optional, falls back to the cookie (Laravel) |
| Malformed JSON | Not documented | 422 `json_invalid` (NestJS) |
| `/redoc` | Served | Not served by NestJS (use `/docs`) |
| `/metrics` | n/a | Not provided by Laravel (NestJS has a metrics service behind `METRICS_ENABLED`) |
| API-key tenancy | Follows `X-Tenant-ID` | Laravel pins a key to its creating tenant |
| Not implemented in the ports | n/a | MFA, audit read API |

Verify against the backend READMEs for the current state. Security review findings and fixes for each port are in [`docs/backend-parity/security/`](../backend-parity/security/).

## 9. Parity suite and gap report

The suite in [`tests/parity`](../../tests/parity/README.md) is a black-box test file that runs against any backend. It performs first-run setup, so it needs an empty database.

```bash
# fresh database, backend started with SETUP_TOKEN=parity-setup-token
BASE_URL=http://127.0.0.1:8002 SETUP_TOKEN=parity-setup-token node --test tests/parity/kernel.parity.test.mjs
```

Helpers: `scripts/parity/reset-db.mjs <db-name>` recreates a database (needs the `pg` module; see `tests/parity/README.md`). Against the FastAPI reference, set `KNOWN_REFERENCE_BUGS=1` to skip the tests that cover the reference defects (the ports must pass without it).

Gap report: diff a backend's OpenAPI document against the reference.

```bash
node scripts/parity/gap-report.mjs kernel/backend-laravel/openapi.json   # expected 31/31
node scripts/parity/gap-report.mjs kernel/backend-nestjs/openapi.json
```

The backend parity workflow (`.github/workflows/backend-parity.yml`) runs the suite against all three backends in CI.

Step-by-step runs per backend are in the "Parity suite" sections of the Laravel and NestJS READMEs.

## 10. Adding a new backend

1. Implement the 31 operations in [`endpoints.md`](../backend-parity/endpoints.md) with the response shapes in `apps/api-server/openapi.json`.
2. Follow [`conventions.md`](../backend-parity/conventions.md): error bodies and codes, pagination, soft-delete columns, HS256 tokens and `token_version`, opaque rotating refresh tokens, `inno_live_` API keys, bcrypt cost 12, AES-256-GCM envelopes and the HMAC blind index, setup flow and 503 gate.
3. Apply [`schema.sql`](../backend-parity/schema.sql) with a migration that is a no-op when the tables already exist; widen `api_keys.key_prefix` to 32.
4. Read `ENCRYPTION_KEYS` and `BLIND_INDEX_PEPPER` from the environment, with defaults equal to the FastAPI built-ins for development, and refuse production boot with defaults.
5. Add interop tests against Python-generated vectors (JWT, bcrypt, envelopes, blind indexes).
6. Run the parity suite (it must pass without `KNOWN_REFERENCE_BUGS`) and `gap-report.mjs` (31/31).
7. Add a `project.json` (Nx targets such as `install`, `serve`, `migrate`, `openapi`, `lint`, `test`), a Dockerfile, a compose profile in `docker-compose.backends.yml`, and a README linking back here.
8. Document deviations in `conventions.md`, and add the backend to the tables in this guide.
