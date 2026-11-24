# Kernel parity suite

Backend-agnostic black-box tests of the kernel API. The same file runs against FastAPI, Laravel and NestJS.

```
# fresh, empty database (migrated by the backend under test), backend started with SETUP_TOKEN=parity-setup-token
BASE_URL=http://127.0.0.1:8001 SETUP_TOKEN=parity-setup-token node --test tests/parity/kernel.parity.test.mjs
```

Requires Node >= 20. No dependencies. The suite performs first-run setup, so it must start from an empty (not installed) database.
Tests run in order and share state; a failure in an early test can cascade.

## Identities + credentials suite

`identities.test.mjs` runs against all three backends on one shared database and also queries the database directly
(constraints, backfill, legacy fallback, the no-resurrection rule, concurrent password changes, duplicate rejection):

```
PGPASSWORD=admin PERF=1 SHARED_DB=erp_identities TEST_FILE=tests/parity/identities.test.mjs bash scripts/parity/run-cross-backend.sh
```
`PERF=1` lifts the rate limits because the suite logs in many times.
