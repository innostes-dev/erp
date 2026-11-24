# Security review: NestJS kernel backend (checklist 3.5)

Scope: `kernel/backend-nestjs` (NestJS 11, Node 22, `pg`). Reviewed on 2026-11-24 by reading all of `src/`, `test/`, `Dockerfile`, `.env.example` and `package.json`, then reproducing against a live server (port 8103, database `erp_sec_nest`) before and after the fixes. `conventions.md` was read first and every fix keeps the behaviour the parity suite relies on.

Result: 1 high, 4 medium, 8 low findings. All high/medium findings and the cheap low ones are fixed in `kernel/backend-nestjs` with regression tests (`test/security.e2e-spec.ts`, 16 tests, plus additions to `src/config/env.spec.ts`, `src/common/common.spec.ts`, `src/domain.spec.ts`). Verified afterwards: `npm test` 101 passed, `npm run test:e2e` 47 passed (3 suites), `npm run lint` and `npm run typecheck` clean, parity suite on a freshly reset `erp_nest` (port 8003) 44/44 pass, 0 skipped (incl. the new authorization block). `npm audit --omit=dev`: `nodemailer` fixed; one `zod` advisory remains (accepted, see #R3).

## Findings

| # | Severity | Status | Title |
|---|----------|--------|-------|
| 1 | High | Fixed | Missing authorization (BOLA/BFLA) on tenants and users |
| 2 | Medium | Fixed | `X-Tenant-ID` / "oldest tenant" fallback expose and mutate foreign tenants (incl. API keys) |
| 3 | Medium | Fixed | API keys can mint API keys; keys visible and revocable by any tenant member |
| 4 | Medium | Fixed | Lockout bypass: parallel guesses race the failure counter |
| 5 | Medium | Fixed | `X-Forwarded-For` trusted unconditionally for audit/session/device IP |
| 6 | Medium | Fixed | `nodemailer` 6.10.1 has multiple published high-severity advisories |
| 7 | Low | Fixed | Production-boot gaps (staging/typo envs, placeholder setup token, short keys) |
| 8 | Low | Fixed | bcrypt 72-byte silent truncation of new passwords |
| 9 | Low | Fixed | Huge `offset` produced a 500 |
| 10 | Low | Fixed | `token_version` claim optional in the access-token check |
| 11 | Low | Fixed | Setup-token throttle: unbounded memory and no global cap |
| 12 | Low | Fixed | Missing size bounds on several inputs |
| 13 | Low | Fixed | Console mailer (temp passwords in logs) keyed on `isProduction` only |
| R1 | Low | Accepted | Forgot-password lets anyone invalidate a user's current password |
| R2 | Low | Accepted | Temporary-password sessions are not forced through change-password |
| R3 | Low | Accepted | `zod` advisory (env parsing only) |
| R4 | Info | Accepted | See "Residual risks" for the rest |

### 1. High: missing authorization on tenants and users (fixed)
- Location: `src/tenancy/tenancy.controller.ts` (create/list/get/update/delete/restore), `src/users/users.controller.ts` (create/get). Handlers only had `@UseGuards(AuthGuard)` (authentication). `PermissionGuard`/`RequirePermission` exist but no route used them. `endpoints.md` only says "bearer", so this mirrors the FastAPI reference, but it is exploitable.
- Impact: any authenticated account (even one with no tenant membership and no role) could list every tenant, rename/soft-delete/restore any tenant, create tenants (slug squatting), create users, and read any user's decrypted email and mobile (`GET /users/{id}`).
- Proof (before, as a freshly created non-member): `GET /tenants` 200 (all tenants), `PATCH /tenants/{A}` 200 (renamed to "pwned"), `DELETE /tenants/{B}` 200, `POST /tenants` 201, `POST /users` 201, `GET /users/{adminId}` 200 with the admin's email.
- Fix: tenants: create is super-admin only; list is limited to the caller's active memberships (super admin sees all; `include_deleted` honoured only for super admins); get on a tenant the caller is not a member of returns the same 404 `tenant_not_found` as a missing one; update needs super admin or the RBAC permission `tenancy.tenant.update` in that tenant; delete/restore need `tenancy.tenant.delete` (owner role; the seeded `admin` role has update but not delete). Users: `POST /users` needs super admin or `user.users.create` in a tenant the caller belongs to (the seeded `admin` role has it); `GET /users/{id}` is allowed for self, super admin, or a holder of `user.users.read` in a tenant where the target is also an active member, otherwise 404 `user_not_found` (hides existence; same answer as a missing id). `POST /tenants` and `POST /users` without permission return 403 with `code: "permission_denied"`. `is_super_admin` in the `POST /users` body is still ignored (mass assignment check, covered by a test).
- Proof (after): same requests return `{"items":[],"total":0}`, 404, 404, 403, 403, 404 (unified rules agreed with the Laravel backend; asserted by the parity "authorization" block). Tests in `test/security.e2e-spec.ts`: "a user without membership cannot see, change, delete or create tenants", "members see only their tenants; RBAC decides who may update/delete", "POST /users needs user.users.create; GET /users/:id needs self or user.users.read within a shared tenant".
- Deviation from the reference (documented, the parity suite only acts as super admin): non-super-admin callers get 403/404 where FastAPI answers 200.

### 2. Medium: `X-Tenant-ID` and the "oldest tenant" fallback (fixed)
- Location: `TenancyService.resolveCurrentTenantId`, used unchanged by `TenancyController.currentTenantId` and `AuthController.keyTenantId`.
- Impact: the header tenant was accepted without a membership check, and a user with no membership silently fell back to the oldest tenant. So any authenticated user could read `/tenants/current`, `/current/modules`, `/current/plugins` of any tenant and list/create/revoke API keys of any tenant (a key created this way was bound to the victim tenant).
- Proof (before): non-member `GET /tenants/current` returned Org A; `POST /auth/api-keys` with `X-Tenant-ID: <A>` returned 201 with a `*`-scoped key; `GET /tenants/current/modules` with `X-Tenant-ID: <B>` returned B's modules.
- Fix: new `TenancyService.resolveTenantForUser` (super admin: unchanged; others: header must be an active membership, else 403; no header: first membership, else 404; no fallback to the oldest tenant). An API key's pinned tenant is also re-checked against the owner's current membership. conventions.md still says "else the oldest tenant"; this is now only true for super admins (security deviation).
- Tests: "no 'oldest tenant' fallback and no X-Tenant-ID override for non-members", API keys test.

### 3. Medium: API keys can mint API keys; keys not private (fixed)
- Location: `AuthController.createApiKey/listApiKeys/revokeApiKey`, `ApiKeysService.list/revoke`.
- Impact: a stolen key, even one created with a narrow scope and short expiry, could `POST /auth/api-keys` a new `scopes:["*"]` key, so revoking the stolen key did not evict the attacker. Any tenant member could list and revoke every other member's keys. Scopes are only checked by `PermissionGuard`, which no route uses (see residual risks).
- Proof (before): `POST /auth/api-keys` with `Authorization: Bearer inno_live_...` (scope `x.read`) returned 201 with a `*` key.
- Fix: requests authenticated by an API key get 403 on all three key-management routes; non-super-admin users list/revoke only their own keys unless they hold `tenancy.members.manage` (owner/admin) in the tenant; super admins see all keys of the selected tenant.
- Test: "are confined to the caller membership, private to their creator and cannot mint further keys".

### 4. Medium: lockout bypass through concurrency (fixed)
- Location: `AuthService.login` (check `isBlocked`, then slow bcrypt verify, then increment the counter after the failure).
- Impact: the counter only moved after the ~190 ms bcrypt comparison, so N parallel guesses all passed the "not locked" check. With the login limit of 60/min/IP an attacker gets about 60 verifications per burst instead of 5 per 15 minutes.
- Proof (before): 30 parallel wrong-password logins all returned `invalid_credentials` (30 verified guesses); only afterwards was the account locked.
- Fix (revised after a regression): a first version counted an attempt before verifying the password, which also counted in-flight CORRECT logins, so a user signing in from several tabs/devices at once was locked out. Now login attempts are serialised per account (`AuthService.withAccountLock`): an in-process queue (waiters hold no DB connection, capped at 64 per account, excess gets 429 + `Retry-After`) followed by a transaction-scoped `pg_advisory_xact_lock` (cross-process, `lock_timeout` 10 s, timeout gives 429 + `Retry-After`). Under the lock the blocked state is re-read, the password verified, and a wrong password increments/locks (committed) while a correct one resets the counter and creates the session. The counter is exact: at most `MAX_FAILED_LOGIN_ATTEMPTS` verifications per lock window, and valid logins are never counted. Cost: simultaneous logins to one account take about N x 150 ms.
- Proof (after): 30 parallel wrong logins: exactly 5 `invalid_credentials`, 25 `account_locked`; 12 parallel correct logins: 12 x 200 (also verified with the coordinator's lock.mjs on :8003). Tests: "parallel wrong-password guesses are capped...", "parallel CORRECT logins...", "mixed parallel logins...". The parity lockout test still passes.

### 5. Medium: `X-Forwarded-For` trusted unconditionally (fixed)
- Location: `src/common/http.ts` `clientIp`. It took the first valid XFF entry regardless of `TRUST_PROXY`.
- Impact: any client could forge the address stored in `audit_logs.ip_address`, `user_sessions.ip_address`, `user_devices.last_ip` and `user_security.last_login_ip` (forensic evasion, framing another address). The throttler and setup limiter use `req.ip` and were not affected.
- Proof (before): by code reading and the previous unit test (`'203.0.113.5, 10.0.0.1'` accepted); after: login with `X-Forwarded-For: 6.6.6.6` stores `127.0.0.1`.
- Fix: `clientIp` returns Express' `req.ip`, which honours XFF only for hops the operator configured via `TRUST_PROXY` (hop count or subnet list), and unwraps IPv4-mapped IPv6. Deviation from conventions.md ("first XFF entry"): behind a proxy, set `TRUST_PROXY` (documented in `.env.example`). Startup now logs a warning for `TRUST_PROXY=true` outside development.
- Tests: `clientIp` unit tests, "does not trust a forged X-Forwarded-For for the recorded client address".

### 6. Medium: vulnerable `nodemailer` (fixed)
- `npm audit --omit=dev` listed 20+ advisories for `nodemailer <=10.1.3` (address-parser recipient confusion, SMTP command injection via `envelope.size`/transport name, DoS). The service sends password-reset mail to the decrypted user email, so address parsing bugs are reachable from user-controlled data.
- Fix: upgraded to `nodemailer@10.6.1` (exact pin). The API used (`createTransport`, `sendMail`) is unchanged; typecheck and tests pass.

### 7. Low: production-boot gaps (fixed)
- Insecure development defaults (public JWT secret, public AES key, public pepper) were only rejected when `APP_ENV` was exactly `production`/`prod`. `APP_ENV=staging`, a typo, or `NODE_ENV=production` without `APP_ENV` booted with a publicly known JWT secret (full token forgery).
- `.env.example` shipped `SETUP_TOKEN=change-me-setup-token`; the boot check only required "non-empty".
- Short `ENCRYPTION_KEYS` values are silently zero-padded to 32 bytes.
- Fix (`src/config/env.ts`): any `APP_ENV` other than development/dev/local/test/testing is hardened (same checks as production, message names the environment); `NODE_ENV=production` hardens when `APP_ENV` is unset; hardened envs reject `SETUP_TOKEN` shorter than 16 chars or a documented placeholder, and encryption keys that are neither 64 hex chars nor at least 32 bytes. Cookie `Secure` now defaults to on in every non-development environment. `.env.example` no longer contains a placeholder token.
- Tests in `src/config/env.spec.ts` (staging, typo, NODE_ENV, placeholder, short key).

### 8. Low: bcrypt 72-byte truncation (fixed)
- Passwords up to 128 characters were accepted, but bcrypt only uses 72 bytes. Proof: an account created with a 78-character password accepted login with just its first 72 characters.
- Fix: new `NewPasswordField` (8-128 characters and at most 72 UTF-8 bytes, 422 `string_too_long`) on `POST /users`, setup admin, `change-password`, `reset-password`. Login is unchanged, so existing long-password accounts still work. Deviation from conventions.md (8-128 chars). Pre-hashing was rejected because it would break cross-backend hash compatibility.

### 9. Low: huge `offset` returned 500 (fixed)
`GET /tenants?offset=99999999999999999999` reached PostgreSQL as an out-of-range bigint and produced a logged 500. Integer query values are limited to 15 digits and `offset` to 2147483647 (422).

### 10. Low: optional `token_version` claim (fixed)
`AuthGuard` skipped the revocation check when the claim was missing. Tokens are only forgeable with the secret, so this was defence in depth; a numeric `token_version` is now mandatory. Test: "rejects tokens that are unsigned, wrongly typed or lack token_version" (also covers `alg:none`, HS512, wrong key, `password_reset` typed tokens: all 401).

### 11. Low: setup-token throttle (fixed)
The per-IP failure map grew without bound and only limited each IP (10/15 min). With `TRUST_PROXY=true` an attacker can rotate addresses. Fix: global cap of 100 failures per 15 min across all clients (429 with `Retry-After`) and at most 10 000 tracked clients. Tests in `src/domain.spec.ts`.

### 12. Low: input size bounds (fixed)
Added `MaxLength` to `refresh_token` (512), reset `token` (4096), `current_password` (128) and each API-key scope (128). JSON bodies were already limited to 1 MB (413, tested).

### 13. Low: console mailer (fixed)
`EmailService` logged temporary passwords and reset links whenever `APP_ENV` was not production (e.g. staging without SMTP). It now only does so in development/test environments.

## Accepted risks

### R1. Forgot-password invalidates the current password (low, accepted)
`POST /auth/forgot-password` (public, 10/min/IP) replaces the target's password hash with a random temporary one, revokes all sessions and bumps `token_version`. Anyone who knows an email address can therefore lock the owner out until they use the emailed link (this is the documented reference design, "temporary password + reset link"). Mitigations in place: generic response and constant-ish timing (no enumeration), per-IP rate limit. Recommendation: front it with a CAPTCHA/WAF rule or change the design to "reset link only, password untouched until used" in all three backends together (it changes the contract).

### R2. Temporary-password sessions are not restricted (low, accepted)
A user logging in with an emailed temporary password (`must_change_password=true`) can call every API until they change it; only the response flag tells the client. The temp password expires after 24 h and is single-recipient. Enforcement would add a new error code for clients to handle, so it was left to the front end.

### R3. `zod` advisory (low, accepted)
`npm audit` flags `zod@3.25.76` (memory exhaustion validating oversized collections). zod is used only to parse the process environment at boot, never request data. The fix is a major upgrade (4.x) that changes the API used in `src/config/env.ts`; recommended as routine maintenance.

## Checked and found clean
- SQL: every statement is parameterised. The only interpolated fragments are constants (`k.table`/`k.idCol`, `WHERE` fragments built from fixed strings, `applyScope` identifiers validated by regex). `LIMIT/OFFSET` are bound parameters, `limit` is capped at 200. No dynamic `ORDER BY`.
- JWT: algorithm pinned to the configured HS algorithm (`none`, other HS variants, wrong key all rejected), `type` checked (`access` vs `password_reset`), UUID `sub` validated, `exp` enforced, `token_version` compared with the DB row, super-admin status read from the DB (not from the claim). Reset tokens are single-use via `token_version` and cannot be used as access tokens.
- Refresh tokens: only SHA-256 stored; rotation inside one transaction with `SELECT ... FOR UPDATE`. Six concurrent refreshes of one token: exactly one succeeds, the replay revokes all sessions (tested). Password change/reset revoke all sessions. Expired sessions and wiped devices are refused.
- API keys: 256-bit random, only SHA-256 stored, the raw key is returned once; revocation, expiry and soft delete enforced in one `UPDATE ... RETURNING`; list/read DTOs never contain the hash.
- Setup: `X-Setup-Token` compared with `safeEqual` (hash then `timingSafeEqual`); token checks run only after the 404 availability check; install is serialised by `pg_advisory_xact_lock` plus the `installation` singleton unique index (no TOCTOU double install); `SETUP_ENABLED=false` gives 404; unset `SETUP_TOKEN` generates a 32-byte random token in a `0600` file created with `O_EXCL`, announced in the log, deleted after install; the token supplied via env is never logged; every non-allow-listed route returns 503 before installation.
- Login: unknown email runs a dummy bcrypt (190 ms vs 190 ms measured for unknown vs known address), identical `invalid_credentials` for unknown and wrong password; forgot-password returns the same message for everything and does equal work for unknown accounts; bcrypt cost 12.
- Crypto: AES-256-GCM with a fresh 12-byte random nonce per encryption, 16-byte tag verified, any failure raises (fail closed, 500 without detail), key version selected from the envelope, HMAC blind index with a pepper; no secrets in error bodies.
- Prototype pollution (`__proto__`/`constructor` in a body is stripped by `whitelist`, `Object.prototype` untouched, tested), malformed JSON gives 422, oversized body 413, unknown properties stripped (no mass assignment: `is_super_admin` on `POST /users` ignored, tested).
- Errors: global filter returns `{detail, code}` only; unhandled errors produce a generic 500 and are logged server-side; no stack traces in responses; `x-powered-by` disabled.
- Logging: pino redacts `Authorization`, `Cookie`, `X-Setup-Token`, `Set-Cookie`; request serializer logs path without query string (reset tokens in URLs are not logged); bodies are not logged. Correlation IDs are validated against `[\w.:-]{1,128}` (no log/header injection).
- Reset link: built from the configured `FRONTEND_URL` only (no Host header use, no open redirect), email address URL-encoded, HTML escaped in the mail body.
- CORS: explicit origin allow-list (no `*`, refused at production boot), credentials on; helmet defaults with CSP and HSTS in production; cookies are `HttpOnly`, `SameSite=Lax`, `Secure` outside development, refresh cookie scoped to `/auth`.
- Unhandled rejections: fire-and-forget mail send has a `.catch`; audit writes cannot fail a request; DB pool errors are handled.
- ReDoS: slug/UUID/envelope regexes are linear and applied to length-bounded input; email validation uses `class-validator`.
- Dockerfile: pinned base tag, multi-stage, `npm prune --omit=dev`, runs as the unprivileged `node` user, no `.env` copied (`.dockerignore`), healthcheck without extra tooling.

## Residual risks and recommendations for operators
1. Set `TRUST_PROXY` to the exact number of proxy hops (or the proxy subnets) when behind a load balancer; never `true`. With the default `false` all clients behind one proxy share one rate-limit bucket (and the setup limiter), with `true` clients can spoof their address.
2. The throttler and setup limiter are in-memory per process: with N replicas the effective limits are N times higher and reset on restart. Add a shared limiter (reverse proxy, WAF or Redis storage) for internet-facing deployments. The per-account lockout is stored in PostgreSQL and is shared.
3. Lockout is also a denial-of-service lever (5 bad logins lock an account for 15 minutes) and `account_locked` / `account_suspended` answers reveal that an address exists. Both are standard trade-offs and match the reference contract.
4. API-key scopes are stored but not enforced by any kernel route (no route uses `RequirePermission`); an API key acts with its owner's full rights. Treat keys as full credentials until downstream modules enforce scopes.
5. Audit rows (`actor_email`, `reason`, `changes.email`) contain plaintext email addresses, as in the reference. Restrict database/read access accordingly or mask them in a future change.
6. `/docs`, `/redoc` and `/openapi.json` are public by contract (also before setup). Block them at the proxy in production if the API description is sensitive.
7. `DB_SSL_MODE=prefer`/`allow` with discrete DB settings means no TLS in `pg`; use `require`/`verify-full` (or `sslmode` in `DATABASE_URL`) for non-local databases. `METRICS_ENABLED=true` should always be paired with `METRICS_TOKEN` or network restriction.
8. Rotate `JWT_SECRET_KEY`, `ENCRYPTION_KEYS` and `BLIND_INDEX_PEPPER` from the insecure defaults before first install (production boot enforces this); the pepper cannot be changed once data exists.
9. `user_sessions` rows are never purged (one row per login/refresh); schedule a cleanup of expired/revoked sessions.
10. Keep dependencies patched (`npm audit --omit=dev` in CI) and plan the `zod` 4 migration.
