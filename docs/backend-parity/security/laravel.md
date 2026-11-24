# Security review: Laravel kernel backend (checklist 3.5)

Scope: `kernel/backend-laravel` (Laravel 12, PHP 8.2). Reviewed on 2026-11-24 by reading all of `app/`, `routes/`, `config/`, `bootstrap/`, `docker/`, `Dockerfile`, `.env.example`, then reproducing against a live server (port 8102, database `erp_sec_laravel`) before and after the fixes.

Result: 1 high, 3 medium, 5 low findings. All high/medium and the cheap low findings are fixed in `kernel/backend-laravel` with regression tests in `tests/Feature/SecurityReviewTest.php`. Verified after the final revision (unified authorization rules, see below): `composer test` 61 passed (554 assertions), `composer lint` and `composer analyse` clean, parity suite 44/44 pass, 0 skipped (fresh `erp_laravel`, port 8002, including the "authorization (no tenant membership, no roles)" block).

**Unified authorization rules (revision 2, binding for Laravel and NestJS, mirrors `nestjs.md`):** seeded RBAC permissions decide, not a hard-coded super-admin check. See finding 1. `composer audit`: no advisories.

## Findings

| # | Severity | Status | Title |
|---|----------|--------|-------|
| 1 | High | Fixed | Missing authorization (BOLA/BFLA) on tenants and users |
| 2 | Medium | Fixed | `X-Tenant-ID` selects any tenant (cross-tenant read) |
| 3 | Medium | Fixed | API keys can mint API keys (persistence, scope/expiry escalation) |
| 4 | Medium | Fixed | `X-Forwarded-For` trusted unconditionally for audit/session/device IP |
| 5 | Low | Fixed | `token_version` claim optional in access-token check |
| 6 | Low | Fixed | Forgot-password lets anyone keep an account locked out |
| 7 | Low | Fixed | Cookie auth without Origin check (CSRF defence in depth) |
| 8 | Low | Fixed | Missing size bounds on several inputs |
| 9 | Low | Fixed | Production-boot gaps and risky defaults |
| 10 | Low | Fixed | bcrypt 72-byte truncation of new passwords |
| 11 | Low | Accepted | Account-state oracle and lockout DoS |
| 12 | Info | Accepted | Setup-token throttle is a non-atomic cache read/modify/write |

### 1. High: missing authorization on tenants and users (fixed)
- Location: `app/Http/Controllers/TenantController.php` (index/store/show/update/destroy/restore), `app/Http/Controllers/UserController.php` (store/show) at the time of review only called `$this->actor()` (authentication, no authorization). `endpoints.md` only says "bearer", so this mirrors the reference, but it is exploitable.
- Impact: any authenticated user (e.g. an ordinary employee account) could list every tenant including soft-deleted ones (`include_deleted`), read/rename/soft-delete/restore any tenant, create tenants, create users, and read any user's decrypted email and mobile (`GET /users/{id}` returns decrypted PII).
- Proof (before): as a freshly created non-admin user: `GET /tenants` 200 (all tenants), `PATCH /tenants/{other}` 200, `DELETE /tenants/{other}` 200, `POST /tenants` 201, `GET /users/{adminId}` returned the admin's email.
- Fix (final rules, same as NestJS):
  - `POST /tenants`: super admin only, else 403 `permission_denied`.
  - `PATCH /tenants/{id}`: super admin, or an active member whose roles (global or tenant-scoped, unexpired) grant `tenancy.tenant.update` (seeded: owner, admin). `DELETE /tenants/{id}` and `POST /tenants/{id}/restore`: `tenancy.tenant.delete` (seeded: owner only). A member lacking the permission gets 403 `permission_denied`.
  - A non-member gets 404 `tenant_not_found` on GET/PATCH/DELETE/restore (existence hidden, never 403).
  - `GET /tenants` is limited to the caller's active memberships (super admin sees all; `include_deleted` is honoured only for super admins).
  - `POST /users`: super admin, or a member holding `user.users.create` in the tenant selected by `X-Tenant-ID` (must be a membership) or the first membership (seeded: owner, admin); else 403 `permission_denied`. `is_super_admin` in the body is still ignored.
  - `GET /users/{id}`: self, super admin, or a holder of `user.users.read` in a tenant (selected the same way) where the target is also an active member (seeded: owner, admin, member); otherwise 404 `user_not_found`.
  - Implementation: `RbacService::hasPermission` plus `TenantContext::isMember`; checks live in `TenantController::authorizeTenant` and `UserController`.
- Proof (after): the same requests as an outsider return `[]/0`, 403 `permission_denied`, 404, 404, 404, 403 `permission_denied`. Tests (each permission has a member-with-role case): `test_outsider_without_membership_or_roles_is_denied_everywhere`, `test_tenant_list_is_limited_to_memberships_and_hides_deleted`, `test_tenant_update_and_delete_follow_rbac_permissions` (plain member/`member` 403, `admin` update only, `owner` delete+restore, owner still cannot POST /tenants), `test_user_creation_needs_user_users_create`, `test_user_profiles_need_self_super_admin_or_user_users_read_in_a_shared_tenant`.
- Cross-backend note: Laravel and NestJS now share these rules and the parity block that enforces them. FastAPI keeps the permissive reference behaviour (documented defect).

### 2. Medium: `X-Tenant-ID` selects any tenant (fixed)
- Location: `TenantController::currentTenantId` used `TenantContext::resolve()`, which returns the header tenant without a membership check, and falls back to the oldest tenant for users with no membership.
- Impact: `GET /tenants/current`, `/current/modules`, `/current/plugins` disclosed any tenant's data and enabled modules to any authenticated user.
- Fix: `TenantContext::resolveForMember()`: super admin keeps `X-Tenant-ID`, then first membership, then the oldest tenant; everyone else may only use an active membership: a header naming another tenant is 403 `permission_denied`, no header uses the first membership, and none gives 404 `tenant_not_found` (no "oldest tenant" fallback). Applies to `/tenants/current*` and API-key create/list/revoke. conventions.md still says "else the oldest tenant"; that is now true only for super admins.
- Also: an API key's pinned tenant is re-checked against the owner's current membership. Tests: `test_tenant_context_routes_without_membership_are_404_and_foreign_header_is_403`, `test_api_key_stops_working_for_a_tenant_its_owner_left`.

### 3. Medium: API keys can create API keys; keys not private (fixed)
- Location: `AuthController::createApiKey`/`revokeApiKey`.
- Impact: a stolen key (even one created with `scopes:["read"]` and a 1-day expiry) could mint a new `scopes:["*"]`, never-expiring key, so revoking the stolen key did not evict the attacker. Scopes are not enforced anywhere in the kernel, so a key is effectively the user's full power (accepted, see recommendations).
- Proof (before): `POST /auth/api-keys` with `Authorization: Bearer inno_live_...` returned 201 with a `*`/non-expiring key.
- Fix: API-key-authenticated requests get 403 `permission_denied` on create, list and revoke. For users, keys are private to their creator: list/revoke see only own keys (a foreign key id is 404) unless the caller is a super admin or holds `tenancy.members.manage` in the tenant (seeded: owner, admin). Tests: `test_api_keys_cannot_manage_api_keys`, `test_api_keys_are_private_unless_members_manage_or_super_admin`.

### 4. Medium: client IP taken from `X-Forwarded-For` unconditionally (fixed)
- Location: `app/Kernel/Support/ClientIp.php`, used for audit rows, `user_security.last_login_ip`, sessions, devices.
- Impact: any client could forge the IP recorded in audit logs and sessions (audit-trail integrity, hides the real source of a login). Rate limits and the setup throttle already used `$request->ip()`, so they were not affected.
- Proof (before): `X-Forwarded-For: 6.6.6.6` on login produced `audit_logs.ip_address = 6.6.6.6` and `last_login_ip = 6.6.6.6`. After: `127.0.0.1`. Now `X-Forwarded-For` is honoured only through `TRUSTED_PROXIES` (Laravel's `$request->ip()`). Deviation from `conventions.md` ("first entry is the client IP"): the first entry is still used when the direct peer is a configured trusted proxy. Test: `test_spoofed_forwarded_for_is_not_recorded_without_trusted_proxy`.

### 5. Low: `token_version` optional (fixed)
`AuthenticateKernel` only compared `token_version` when the claim was present. Requires the signing secret to exploit, but a token without the claim bypassed server-side revocation (also relevant when the development default secret is left in place). Claim is now mandatory and must be an integer equal to the stored value. Test: `test_access_token_without_token_version_claim_is_rejected`.

### 6. Low: forgot-password account lockout (fixed, partially)
`POST /auth/forgot-password` rotates the target's password to a temporary one and revokes all sessions (reference behaviour), so anyone who knows an email could keep that account unusable. Added a per-target-account limit (5/hour, `kernel-forgot`, 429 with `Retry-After`) on top of the per-IP limit. The fundamental design (password is replaced before the user proves mailbox access) is mandated by the reference and remains; see recommendations. Test: `test_forgot_password_is_limited_per_target_account`.

### 7. Low: cookie authentication without Origin check (fixed)
The `access_token` cookie authenticates requests and the body parser accepts any `Content-Type` (e.g. `text/plain` JSON). With the default `SameSite=lax` this is not exploitable, but `COOKIE_SAMESITE=none` would be. Cookie-authenticated unsafe-method requests whose `Origin` is not in `CORS_ORIGINS` (or the app's own origin) now get 403. Bearer requests are unaffected. Test: `test_cookie_authenticated_writes_from_foreign_origins_are_rejected`.

### 8. Low: missing input bounds (fixed)
Added `max:254` on emails (previously unbounded up to the 2 MB body limit; bcrypt/HMAC cost is bounded but storage and validation were not), `max:2048` on reset tokens, `max:512` on logout refresh token, `max:128` on current password, `max:50` entries for API-key scopes. Test: `test_oversized_inputs_are_rejected`.

### 9. Low: production boot checks and defaults (fixed)
- `CORS_ORIGINS="*"` with credentialed CORS is now refused in production.
- `SETUP_TOKEN` shorter than 16 characters is refused in production while setup is enabled.
- `COOKIE_SECURE` now defaults to true when `APP_ENV=production` (still overridable).
- Password-reset credentials (temporary password, reset link) are logged only when `APP_ENV` is one of `local|development|dev|testing` (allow-list). Before, any value other than exactly `production` (e.g. `staging`, `prod`) logged them when SMTP is not configured.
- Setup token file is created with `umask(0177)` so it is never group/world readable even briefly (previously `chmod` after creation).
Test: `test_production_rejects_wildcard_cors_and_short_setup_tokens`.

### 10. Low: bcrypt 72-byte truncation (fixed)
Passwords up to 128 characters were accepted but bcrypt only uses 72 bytes, so the tail was silently ignored. New passwords (create user, setup admin, change-password, reset-password) are now rejected with 422 `string_too_long` when longer than 72 UTF-8 bytes (`max_bytes` validation rule); login still accepts up to 128 characters so existing accounts keep working. Deviation from conventions.md (8-128 chars), same as NestJS. Test: `test_new_passwords_are_limited_to_72_bytes_but_login_still_accepts_128`.

### 11. Low: account-state oracle and lockout DoS (accepted)
Specified behaviour: a locked account returns `account_locked` (with `Retry-After`) and a suspended one `account_suspended`, which reveals the account exists; and anyone can lock a known account for 15 minutes with 5 bad logins. Unknown vs wrong-password responses and timings are identical (measured 0.213 s vs 0.215 s over 3 runs; the dummy hash is a valid bcrypt hash). Mitigated by the per-IP and per-IP+account throttles.

### 12. Info: setup throttle non-atomic (accepted)
`SetupToken::recordFailure` reads and rewrites a cache array, so truly concurrent guesses can slightly exceed 10 attempts. Not practically exploitable: the token is 256-bit random when generated, `SETUP_TOKEN` must be >= 16 characters in production, and `/setup*` also sits behind `throttle:kernel-api` (600/min/IP). Use a shared atomic cache (Redis) in multi-instance deployments.

## Checked and found clean
- **Route authentication**: every route in `routes/kernel.php` matches `endpoints.md` (public: setup status, login, refresh, forgot/reset, system routes; everything else behind `kernel.auth`). Module/plugin activation requires super admin (checked from the DB row, not the JWT claim; also verified by the parity test).
- **JWT**: `firebase/php-jwt` 7 with a single pinned `Key(secret, HS256)`, so `alg=none`/algorithm confusion is rejected; `exp` enforced; `type` must be `access` (reset tokens cannot be used as access tokens and vice versa); `sub` must be a UUID; users soft-deleted/suspended/locked are rejected on every request; `is_super_admin` is read from the DB, never from the token.
- **Refresh tokens**: 48 random bytes, only SHA-256 stored, atomic compare-and-set rotation. Race test: 8 concurrent refreshes of the same token produced exactly one 200 and seven 401. Reuse of a revoked token revokes all sessions (parity-tested). Password change/reset/forgot revoke sessions via `token_version` and session revocation.
- **API keys**: 32 random bytes, SHA-256 hash stored, raw key shown once, `key_prefix` only, revoke is tenant-scoped (IDOR-checked), expiry and revocation honoured, `key_hash` never serialised.
- **Setup**: `hash_equals` token compare, per-IP throttle, 404 once installed or disabled, 503 gate for every other route, token file deleted after install, `kernel:setup-token` refuses after install. Concurrency: 6 parallel `POST /setup` with different slugs/emails on a fresh DB (8 PHP workers) gave one 201, five 409 `already_installed`, and exactly 1 installation/tenant/user row. `admin` block is mandatory (no default-password fallback).
- **Mass assignment / privilege escalation**: models are unguarded but only filled from explicit arrays built from validated input; `is_super_admin` in `POST /users` is accepted by the schema but dropped (verified: response `false`); no endpoint assigns roles.
- **SQL injection**: no raw SQL with user input (the only `DB::select` is `select 1`); all lookups are bound via Eloquent/query builder; path ids are UUID-validated.
- **Crypto**: AES-256-GCM with a fresh `random_bytes(12)` nonce per encryption, 16-byte tag verified, no AAD per convention; decrypt failures throw (fail closed -> generic 500, no detail leaked); wrong/missing key versions throw; production refuses default/short keys and pepper (also when `ENCRYPTION_KEYS` is invalid JSON, which falls back to the default key and is then caught by the check). Blind index is HMAC-SHA256 with a pepper.
- **Account enumeration**: login and forgot-password do equal bcrypt work for unknown accounts; forgot-password always returns the same message. (When SMTP is configured the mail round-trip adds latency for known accounts; see recommendations.)
- **Error handling**: JSON-only errors, unhandled exceptions render `{"detail":"Internal server error"}` (no stack, no SQL), `APP_DEBUG` defaults false and production refuses true; malformed JSON gives 422; database outages are 503.
- **Headers/CORS/cookies**: `nosniff`, `X-Frame-Options: DENY`, `no-referrer`, CSP `default-src 'none'`, CORP, `Cache-Control: no-store`, HSTS when secure; CORS allows only `CORS_ORIGINS` (verified an evil origin gets no `Access-Control-Allow-Origin`); auth cookies are HttpOnly, SameSite=lax, refresh cookie scoped to `/auth`, Secure per config.
- **Logging**: JSON logs; request log has method/path/status/ip/user id only (no query string, body, tokens or credentials); `X-Correlation-ID` is validated (`^[A-Za-z0-9._-]{1,128}$`) so it cannot inject into logs/audit rows; audit diffs strip password/token keys; audit writes never fail the request.
- **Reset links**: built from the configured `FRONTEND_URL` (never the `Host` header), so no open redirect/host-header poisoning; reset token is single use via `token_version`.
- **SSRF**: none (no outbound HTTP; SMTP host is operator config).
- **Dependencies**: `composer audit` reports no advisories.
- **Container**: Dockerfile runs as UID 10001, exposes only 8000, copies no tests/.env, `expose_php=Off`, `display_errors=Off`, nginx `server_tokens off`, `client_max_body_size 2m`, `APP_ENV=production`/`APP_DEBUG=false`; entrypoint runs `config:cache` so the production boot check fails the container on insecure config.
- **Rate limiting keys**: use `$request->ip()` (proxy-aware only for `TRUSTED_PROXIES`), so spoofing `X-Forwarded-For` does not bypass them by default (code review only; not load-tested).

## Residual risks and operator recommendations
1. Set `TRUSTED_PROXIES` to the exact reverse-proxy IPs/CIDRs. Do not use `*` unless the app is reachable only through the proxy: with `*` a client can forge `X-Forwarded-For` and bypass the IP-based rate limits (the account lockout still applies).
2. Use a shared atomic cache (`CACHE_STORE=redis`) when running more than one instance, otherwise rate limits and the setup throttle are per node.
3. Set unique `JWT_SECRET_KEY`, `ENCRYPTION_KEYS`, `BLIND_INDEX_PEPPER` (the shared development defaults are public in the repo and `conventions.md`; the app refuses to boot with them only when `APP_ENV=production`). Never expose a non-production instance to untrusted networks, because tokens can be forged with the default JWT secret.
4. Serve only over HTTPS (`COOKIE_SECURE` defaults on in production), set `DB_SSLMODE=require` for remote databases, and give the DB role least privilege (it needs DDL only for migrations).
5. Disable the wizard after installation (`SETUP_ENABLED=false`); it already returns 404 once installed.
6. API-key scopes are stored but not enforced anywhere: treat every key as full user access until scope enforcement exists, and keep expirations short.
7. Forgot-password replaces the password before the user proves mailbox access (reference design); consider a "pending reset" flow in all backends. When SMTP is enabled, send the mail from a queue so latency does not reveal which emails exist.
8. FastAPI still has the permissive reference authorization and the 72-byte password gap; apply the rules of findings 1 and 10 there too.
9. Deleted/disabled-user audit and PII: audit rows hold plaintext actor email/name and IP; apply the retention policy your privacy regime requires.
