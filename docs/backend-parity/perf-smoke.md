# Performance smoke test (task 3.6)

Run: `TEST_FILE=tests/parity/perf-smoke.mjs scripts/parity/run-cross-backend.sh` (one fresh shared DB, all three backends, rate limiters lifted for the run).
2026-11-24, one developer laptop, PostgreSQL 16 local, dev servers (uvicorn single process, `php -S` with 8 workers, `node dist/main.js`). 1500 requests at concurrency 20; logins: 60 requests at concurrency 6 against **one account**. **Smoke test, not a benchmark** — it shows gross regressions and relative order of magnitude only. All requests succeeded (0 errors) on all three backends.

| Endpoint | FastAPI | Laravel | NestJS |
| --- | --- | --- | --- |
| `GET /health` | 838 rps, p95 27 ms | 466 rps, p95 53 ms | 1839 rps, p95 16 ms |
| `GET /auth/me` | 185 rps, p95 165 ms | 295 rps, p95 77 ms | 891 rps, p95 28 ms |
| `GET /tenants?limit=20` | 347 rps, p95 66 ms | 338 rps, p95 68 ms | 1287 rps, p95 18 ms |
| `POST /auth/login` (bcrypt cost 12, same account) | 4 rps, p50 1358 ms | 23 rps, p50 234 ms | 5 rps, p50 1170 ms |

Reading the numbers:
- **FastAPI login** is slow because bcrypt runs on the event loop and blocks every other request while it hashes (p95 2.5 s at concurrency 6). Recommend moving `hash_password`/`verify_password` to a thread pool (reference left unmodified).
- **NestJS login** is intentionally serialised per account (`pg_advisory_xact_lock`, ~150 ms per attempt) so brute-force lockout counting is exact; concurrent logins for *different* accounts are not serialised. Same-account throughput is therefore ≈ 1 / bcrypt time.
- **Laravel** runs under `php -S` here; production uses nginx + php-fpm (see its Dockerfile), expect different absolute numbers.
- Rate limits are lifted only for this run (`RATE_LIMIT_*`); in production the defaults (600 requests/min per client) apply.
