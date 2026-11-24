# Innostes kernel API - NestJS

NestJS 11 (TypeScript strict, Node 22) implementation of the platform kernel API. It serves the same 31 operations
as the FastAPI reference (`kernel/backend`) with identical request/response shapes, error format, cookies, tokens
and encryption, against the **same PostgreSQL schema**, so one database can be served by FastAPI, Laravel or NestJS
interchangeably (tokens, bcrypt hashes and AES-GCM encrypted PII interoperate).

Contract documents: `docs/backend-parity/` (`CHECKLIST.md`, `conventions.md`, `endpoints.md`, `schema.sql`).

## Stack

| Concern | Choice |
| --- | --- |
| Framework | NestJS 11 / Express 5, `@nestjs/swagger` (OpenAPI at `/openapi.json`, Swagger UI at `/docs`) |
| Database | PostgreSQL via `pg` with hand written **parameterised** SQL and explicit transactions (no ORM, no `synchronize`) |
| Validation | `class-validator` DTOs rendered as FastAPI-style `422 {"detail":[{"loc","msg","type"}]}` |
| Auth | `jsonwebtoken` (HS256), `bcrypt` (cost 12, verifies `$2a$/$2b$/$2y$`), `node:crypto` AES-256-GCM + HMAC blind index |
| Hardening | `helmet`, `@nestjs/throttler`, account lockout, refresh-token reuse detection, constant-time secret compares |
| Logging | `nestjs-pino` structured JSON, `X-Correlation-ID`, secrets redacted |
| Config | `zod`-validated environment; the server refuses to boot in production with insecure defaults |

## Run

```bash
cd kernel/backend-nestjs
npm ci
cp .env.example .env            # then edit; or export variables
npm run build
npm run migrate                 # creates the schema; no-op when the `tenants` table already exists
npm run start:prod              # http://localhost:8001  (PORT)
```

Development: `npm run start:dev`. The package is self-contained (own `package-lock.json`); install it with npm,
not through the root pnpm workspace.

First run: with a fresh database every route except `/`, `/health`, `/docs*`, `/openapi.json` and `/setup*` answers
`503 setup_required`. Complete setup with `POST /setup` (header `X-Setup-Token: $SETUP_TOKEN`); see `/docs`.
After installation `/setup*` answers `404 setup_not_available`.

### Docker

```bash
docker build -t innostes-kernel-nestjs .
docker run --rm --env-file .env innostes-kernel-nestjs node dist/migrate.js
docker run -d --env-file .env -p 8001:8001 innostes-kernel-nestjs
```

Multi-stage, pinned `node:22.12.0-bookworm-slim`, non-root `node` user, `HEALTHCHECK` on `/health`.

## Test

```bash
npm test               # unit tests (no database); includes Python-reference interoperability vectors
npm run test:e2e       # supertest against a real PostgreSQL (creates/drops the dedicated DB `erp_nest_e2e`)
npm run lint && npm run typecheck
```

e2e environment: `E2E_ADMIN_DATABASE_URL` (default `postgresql://postgres:admin@localhost:5432/postgres`, used only to
create/drop `erp_nest_e2e`) or `TEST_DATABASE_URL` to point at a specific empty database.

Cross-backend vectors: `test/fixtures/generate_python_vectors.py` produces envelopes, blind indexes, a JWT and bcrypt
hashes with the FastAPI implementation (`python-vectors.json`); `src/crypto/interop.spec.ts` additionally has the
Python reference verify Node-produced artifacts (skipped when `apps/api-server/.venv` is absent).

### Parity suite (black box, repository root)

```bash
PG_MODULE_FROM=<path to a package.json that can resolve 'pg'> node scripts/parity/reset-db.mjs erp_nest
DATABASE_URL=postgresql://postgres:admin@localhost:5432/erp_nest PORT=8003 SETUP_ENABLED=true SETUP_TOKEN=parity-setup-token \
  node kernel/backend-nestjs/dist/migrate.js
DATABASE_URL=... PORT=8003 SETUP_ENABLED=true SETUP_TOKEN=parity-setup-token node kernel/backend-nestjs/dist/main.js &
BASE_URL=http://127.0.0.1:8003 SETUP_TOKEN=parity-setup-token node --test --test-reporter=spec tests/parity/kernel.parity.test.mjs
```

The suite must pass **without** `KNOWN_REFERENCE_BUGS`. OpenAPI: `npm run openapi` writes `openapi.json`;
`node scripts/parity/gap-report.mjs kernel/backend-nestjs/openapi.json` reports `31/31`.

## Configuration

Every variable is documented in `.env.example`. Notable behaviour:

* `APP_ENV=production` requires a unique `JWT_SECRET_KEY` (>= 32 chars), non-default `ENCRYPTION_KEYS` and
  `BLIND_INDEX_PEPPER`, a database configuration, and `SETUP_TOKEN` while `SETUP_ENABLED=true`; otherwise the process exits.
* The default development keys equal the FastAPI defaults on purpose, so a local database works across backends.
  **All backends sharing a database must use the same `JWT_SECRET_KEY`, `ENCRYPTION_KEYS` and `BLIND_INDEX_PEPPER`.**
* Behind a proxy set `TRUST_PROXY` so throttling uses the real client IP. The built-in throttler store is per-process;
  run a shared store (e.g. Redis) if you scale horizontally.

## Layout

```
src/
  config/      zod environment validation
  common/      error classes, exception filter, validation (422), rate-limit table, http helpers
  crypto/      AES-GCM envelope + blind index, bcrypt, JWT/refresh/API-key helpers
  db/          pool + transactions, schema migrator (no-op if schema exists)
  migrations/  generated from docs/backend-parity/schema.sql (node scripts/gen-schema.js)
  auth/        login/refresh/logout/me/password flows, API keys, AuthGuard (JWT + cookie + inno_live_ keys)
  users/ tenancy/ setup/ rbac/ audit/ system/
test/          e2e specs, fixtures (Python-generated vectors)
```

RBAC building blocks (`RbacService`, `@RequirePermission(code)`, `applyScope`) are provided for business modules; the 31 kernel
operations themselves only need authentication (as in the reference).

## Differences from the FastAPI reference

See "Deviations" in `docs/backend-parity/conventions.md` (appended section) and the list below.

* Tenant, module and plugin routes require authentication (reference accepts anonymous callers on some).
* API keys are bound to the active tenant (reference used the user id as tenant id and failed with 500).
* Lockout counters and refresh-reuse revocations are committed even though the response is a 401.
* `POST /auth/reset-password` is implemented (reference raises 500). Password change/reset also revoke all refresh tokens.
* `POST /setup` requires the `admin` object (reference falls back to a built-in default admin and password).
* `api_keys.key_prefix` is `VARCHAR(16)` in the reference schema; the first 14 characters are stored and `...` is appended
  in responses (the documented 17-character value cannot be stored).
* A duplicate mobile number is `409 mobile_already_exists` (reference: 500). Malformed JSON is 422 `json_invalid`.
* `GET /redoc` is not served (Swagger UI at `/docs`, raw spec at `/openapi.json`).

See the [Multi-Backend Guide](../../docs/backends/README.md) for how this backend fits with the others.
