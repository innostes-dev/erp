# Kernel API - Laravel implementation

PHP 8.2 / Laravel 12 implementation of the platform kernel API. It is behaviourally identical to the FastAPI kernel in
`kernel/backend` (same routes, error format, token formats, PII encryption and PostgreSQL schema), so the web-app and a
shared database work unchanged against either backend. Business modules and plugins are out of scope.

* 31 kernel operations (see `docs/backend-parity/endpoints.md`), served at the root: `/auth/*`, `/setup*`, `/tenants*`,
  `/users*`, `/`, `/config`, `/health`, `/openapi.json`.
* Own auth scheme (no Sanctum/Passport): HS256 JWT access token (30 min), rotating opaque refresh token (SHA-256 at rest),
  `inno_live_` API keys, HttpOnly cookies, `token_version` invalidation, ETag/304 on `/auth/me`.
* PII (email, mobile) encrypted with AES-256-GCM envelopes + HMAC-SHA256 blind index; bcrypt passwords (interoperable with
  the Python and NestJS backends in both directions - see `tests/Unit/InteropTest.php`).
* Hardening: FastAPI-style 422 validation errors, `{"detail","code"}` error bodies, rate limiting (per IP and per account),
  persistent lockout, refresh-token reuse detection, setup token with constant-time compare + throttling, security headers,
  correlation ids, structured JSON logs, audit log, refuses to boot in production with insecure secrets.

## Run locally

Requirements: PHP 8.2+ (`pdo_pgsql`, `openssl`, `mbstring`), Composer, PostgreSQL 14+.

```bash
cd kernel/backend-laravel
composer install
cp .env.example .env            # set DB_* (or DATABASE_URL), SETUP_TOKEN, ...
php artisan key:generate
php artisan migrate             # applies database/schema/kernel.sql (no-op if the tables already exist)
php artisan serve --port=8000   # development server; use the Docker image (nginx + php-fpm) in production
```

Open `GET /setup/status`, then run the wizard (`POST /setup` with header `X-Setup-Token`). Until setup completes every
other route answers `503 {"code":"setup_required"}`.

### Sharing one database with the other backends

`database/schema/kernel.sql` is the reference schema (`docs/backend-parity/schema.sql`). The first migration is a no-op when
the `tenants` table already exists, so the same database can be served by FastAPI, Laravel or NestJS interchangeably. Use the
same `JWT_SECRET_KEY`, `ENCRYPTION_KEYS`, `ENCRYPTION_CURRENT_KEY_VERSION` and `BLIND_INDEX_PEPPER` on every backend.
The second migration widens `api_keys.key_prefix` to `VARCHAR(32)` (the reference `VARCHAR(16)` cannot hold the documented
17-character prefix); it is idempotent and backwards compatible.

## Configuration

Everything is environment driven; `.env.example` lists every variable with its default. Production
(`APP_ENV=production`) refuses to start unless `JWT_SECRET_KEY` (>= 32 chars), every key in `ENCRYPTION_KEYS` and
`BLIND_INDEX_PEPPER` are non-default, and `APP_DEBUG=false`.

## Tests and quality gates

PHPUnit needs a dedicated PostgreSQL database (default `erp_laravel_test` on `localhost`, user `postgres`; override with
`DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD`). It is wiped with `migrate:fresh` on every run - never point it at real data.

```bash
createdb erp_laravel_test      # once
composer test                  # unit (interop vectors) + feature tests
composer lint                  # Laravel Pint (composer lint:fix to apply)
composer analyse               # Larastan / PHPStan level 6
composer openapi               # regenerate openapi.json from the routes
```

Interop vectors in `tests/fixtures/python_vectors.json` come from the FastAPI reference
(`tests/fixtures/generate_vectors.py`). When the reference virtualenv exists (`apps/api-server/.venv`), the unit tests also
verify PHP-written envelopes, blind indexes, JWTs and bcrypt hashes with the Python code.

### Parity suite (acceptance)

From the repository root, with a fresh database (the suite performs first-run setup):

```bash
node scripts/parity/reset-db.mjs erp_laravel          # needs the `pg` module, see tests/parity/README.md
cd kernel/backend-laravel && php artisan migrate --force && php -S 127.0.0.1:8002 -t public public/index.php &
cd ../.. && BASE_URL=http://127.0.0.1:8002 SETUP_TOKEN=parity-setup-token node --test tests/parity/kernel.parity.test.mjs
node scripts/parity/gap-report.mjs kernel/backend-laravel/openapi.json     # 31/31
```

## Docker

```bash
docker build -t innostes/kernel-laravel kernel/backend-laravel
docker run --rm -p 8000:8000 --env-file .env -e RUN_MIGRATIONS=true innostes/kernel-laravel
```

The image runs nginx + php-fpm under supervisord as the unprivileged user `kernel` (uid 10001) on port 8000, logs JSON to
stderr and exposes a `/health` health check. Set `RUN_MIGRATIONS=true` to migrate on start (or run
`php artisan migrate --force` as a release step). Scale horizontally with `CACHE_STORE=redis` so rate limits and setup
throttling are shared.

## Deviations from the FastAPI reference (intentional)

| Reference behaviour | Laravel |
| --- | --- |
| Failed-login counter / lockout / refresh-reuse revocation roll back with the 401 | Committed before the 401 is returned |
| `POST /auth/reset-password` crashes (500) | Implemented (`reset_password_with_token`) |
| `/tenants*` accept anonymous callers | Bearer token (or API key) required |
| `POST /auth/api-keys` fails (user id used as tenant id; prefix column too narrow) | Uses the active tenant; column widened |
| API keys follow the `X-Tenant-ID` header | An API key is pinned to the tenant it was created for; creating keys requires tenant membership (super admins may use any tenant) |
| `POST /setup` without `admin` creates a default admin with a published password | `admin` is required (422) |
| `POST /users` body may carry `is_super_admin` (ignored) | Accepted and ignored, as in the reference |
| `/auth/refresh` body requires `refresh_token` | Optional: falls back to the `refresh_token` cookie (as the reference code intends) |
| Duplicate mobile number -> 500 | 409 |

Known limitation shared with every bcrypt implementation: only the first 72 bytes of a password are significant.

See the [Multi-Backend Guide](../../docs/backends/README.md) for how this backend fits with the others.
