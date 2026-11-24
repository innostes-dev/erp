#!/usr/bin/env bash
# Starts FastAPI (:8201), Laravel (:8202) and NestJS (:8203) against ONE fresh database and runs
# tests/parity/cross-backend.test.mjs. Requires: PostgreSQL reachable, FastAPI venv (apps/api-server/.venv),
# `composer install` done in kernel/backend-laravel, `npm ci && npm run build` done in kernel/backend-nestjs.
# TEST_FILE selects the node script to run against the three servers (default: cross-backend.test.mjs;
# use tests/parity/perf-smoke.mjs for the performance smoke test).
# Env (defaults): PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=admin SHARED_DB=erp_shared WORKDIR=$(mktemp -d)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}" PGPASSWORD="${PGPASSWORD:-admin}"
DB="${SHARED_DB:-erp_shared}"
WORK="${WORKDIR:-$(mktemp -d)}"
export SETUP_TOKEN="${SETUP_TOKEN:-parity-setup-token}"
SECRETS_JWT="${JWT_SECRET_KEY:-parity-shared-jwt-secret-0123456789abcdef}"
URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$DB"
PIDS=()
# each server runs in its own session/process group (setsid) so cleanup also stops forked workers
cleanup() { for p in "${PIDS[@]:-}"; do kill -- "-$p" 2>/dev/null || kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT

node "$ROOT/scripts/parity/reset-db.mjs" "$DB"

# 1) FastAPI owns the reference migrations (Alembic).
( cd "$ROOT/kernel/backend" && DATABASE_URL="$URL" "$ROOT/apps/api-server/.venv/bin/python" -m alembic -c alembic.ini upgrade head >/dev/null )
# Perf mode: the production rate limiters would throttle the load generator, so lift them (PERF=1 only).
if [ "${PERF:-0}" = "1" ] || [ "${TEST_FILE:-}" = "tests/parity/perf-smoke.mjs" ]; then
  export RATE_LIMIT_API_PER_MINUTE=10000000 RATE_LIMIT_AUTH_PER_MINUTE=10000000 RATE_LIMIT_LOGIN_PER_ACCOUNT_PER_MINUTE=10000000 \
         RATE_LIMIT_GLOBAL_PER_MINUTE=10000000 RATE_LIMIT_LOGIN_PER_MINUTE=10000000 RATE_LIMIT_REFRESH_PER_MINUTE=10000000
fi
export ROOT URL SECRETS_JWT WORK PGHOST PGPORT PGUSER PGPASSWORD DB
setsid bash -c 'cd "$ROOT/apps/api-server" && DATABASE_URL="$URL" PORT=8201 SETUP_ENABLED=true JWT_SECRET_KEY="$SECRETS_JWT" exec .venv/bin/python -m uvicorn app.main:app --port 8201 >"$WORK/fastapi.log" 2>&1' & PIDS+=($!)

# 2) Laravel and NestJS run their own (no-op / widening) migrations on the already-migrated DB.
( cd "$ROOT/kernel/backend-laravel" && DB_CONNECTION=pgsql DB_HOST="$PGHOST" DB_PORT="$PGPORT" DB_DATABASE="$DB" DB_USERNAME="$PGUSER" DB_PASSWORD="$PGPASSWORD" JWT_SECRET_KEY="$SECRETS_JWT" SETUP_ENABLED=true php artisan migrate --force >/dev/null )
setsid bash -c 'cd "$ROOT/kernel/backend-laravel" && export DB_CONNECTION=pgsql DB_HOST="$PGHOST" DB_PORT="$PGPORT" DB_DATABASE="$DB" DB_USERNAME="$PGUSER" DB_PASSWORD="$PGPASSWORD" JWT_SECRET_KEY="$SECRETS_JWT" SETUP_ENABLED=true PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-8}" && exec php -S 127.0.0.1:8202 -t public public/index.php >"$WORK/laravel.log" 2>&1' & PIDS+=($!)
( cd "$ROOT/kernel/backend-nestjs" && DATABASE_URL="$URL" JWT_SECRET_KEY="$SECRETS_JWT" SETUP_ENABLED=true node dist/migrate.js >/dev/null )
setsid bash -c 'cd "$ROOT/kernel/backend-nestjs" && export DATABASE_URL="$URL" PORT=8203 JWT_SECRET_KEY="$SECRETS_JWT" SETUP_ENABLED=true && exec node dist/main.js >"$WORK/nest.log" 2>&1' & PIDS+=($!)

for port in 8201 8202 8203; do
  for _ in $(seq 1 60); do curl -fs "http://127.0.0.1:$port/setup/status" >/dev/null 2>&1 && break; sleep 1; done
done
set +e
export FASTAPI_URL=http://127.0.0.1:8201 LARAVEL_URL=http://127.0.0.1:8202 NEST_URL=http://127.0.0.1:8203
if [ -n "${TEST_FILE:-}" ]; then
  node "$ROOT/$TEST_FILE"
else
  node --test --test-reporter=spec "$ROOT/tests/parity/cross-backend.test.mjs"
fi
rc=$?
echo "logs in $WORK"
exit $rc
