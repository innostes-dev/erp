# BUSINESS OS — AUTH MODULE: CODE GENERATION PROMPT

You are a Senior Backend Engineer. Generate a complete, production-ready auth module
for a multi-tenant Business OS. Follow every instruction in this file exactly.
Do not skip any file. Do not summarise — output full working code for every file listed.

---

## SYSTEM OVERVIEW

A modular, multi-tenant Business OS built on a Micro-Kernel architecture.
- The "Kernel" owns infrastructure: auth, database, bridge, config.
- "Modules" (HRMS, Assets, Finance, etc.) own business logic.
- Modules never import from each other directly — all cross-module calls go through a ModuleBridge.

---

## TECH STACK — NON-NEGOTIABLE

| Concern          | Choice                                        | Reason                                      |
|------------------|-----------------------------------------------|---------------------------------------------|
| Monorepo         | Nx Integrated Workspace                       | Enforced boundaries between libs and apps   |
| Framework        | NestJS with **Fastify adapter** (not Express) | Lower memory — critical for shared hosting  |
| ORM              | Drizzle ORM                                   | Lightweight, type-safe, no connection pool  |
| Database         | PostgreSQL via **Neon serverless HTTP driver** | No persistent TCP — perfect for cPanel/PM2  |
| Primary Keys     | CUID2 (`@paralleldrive/cuid2`)                | Non-guessable, DB-index friendly            |
| Password hashing | `argon2` (WASM build — no native compile)     | Works on shared hosting without build tools |
| JWT              | `@nestjs/jwt`                                 | Standard NestJS integration                 |
| Validation       | `class-validator` + `class-transformer`       | DTO-level input validation                  |
| Rate limiting    | `@nestjs/throttler` (in-memory storage)       | No Redis required                           |
| Security headers | `@fastify/helmet`                             | X-Frame-Options, HSTS, MIME sniff, etc.     |
| Process manager  | PM2 (cluster mode, max 2 instances)           | cPanel shared hosting compatible            |

---

## DEPLOYMENT TARGET

**Traditional cPanel shared hosting running Node via PM2.**

Constraints this creates:
- No Docker, no root access, no Redis, no native build tools.
- NestJS runs on a high port (3001). Apache proxies via `.htaccess` + `mod_proxy`.
- Memory is shared with other tenants on the server — keep the footprint lean.
- Database must be remote (Neon free tier). No persistent TCP connection pool.
- `argon2` must use its WASM fallback — do NOT use the native binary.
- PM2 cluster capped at 2 instances — throttler state is in-memory per instance.
  **Important**: in-memory throttler is NOT shared across PM2 workers. Each worker
  maintains its own counter, so the effective rate limit is `limit × 2`.
  All throttler limits in this file already account for this — do not double them further.

---

## GLOBAL CODING STANDARDS

Apply these rules to every single file you generate.

1. **Naming**: `snake_case` in all PostgreSQL identifiers. `camelCase` in all TypeScript.
2. **Soft deletes**: Optional. Use `deleted_at` only where explicitly required.
3. **Response envelope**: Every API response must return one of:
   - Success: `{ success: true, data: T }`
   - Error:   `{ success: false, error: { message: string, code: string } }`
4. **Primary keys**: Always CUID2 via `idColumn` util (see `schema/utils.ts`).
5. **No secrets in code**: All secrets come from `process.env` via `ConfigService`.
6. **Timestamps**: Every table has `created_at`, `updated_at` via `auditColumns` util.
7. **Role is never in the JWT**: The JWT payload contains only `{ sub: userId, sid: sessionId }`.
   Role and permissions are always read fresh from the `users` and `roles` tables on every request.
8. **No hard-coding tenant or branch IDs** anywhere in the codebase.
9. **Every Drizzle query** must be scoped with `tenantId` (and `branchId` if the table supports it).
10. **Never return the password hash** in any response, ever.
11. Use `async/await` throughout. No raw `.then()` chains.
12. Every service method must have a JSDoc comment explaining what it does.
13. Every file must have a top-level comment block stating its purpose.

---

## SCHEMA REFERENCE (Authoritative — do not redefine)

> All schema files live in `libs/core/database/src/lib/schema/`.
> Import utilities from `./utils`, never redefine them inline.

### `utils.ts` — shared column factories
```typescript
// idColumn    → CUID2 text PK
// tenantColumn → { tenantId: text, notNull }
// auditColumns → { createdAt, updatedAt } with timezone-aware timestamps
```

### `tenants` table (`tenants.ts`)
| Column     | Type           | Constraints          |
|------------|----------------|----------------------|
| id         | text           | PK (human slug OK)   |
| name       | text           | NOT NULL             |
| slug       | text           | NOT NULL, UNIQUE     |
| branding   | jsonb          | NOT NULL, default {} |
| created_at | timestamp (tz) | NOT NULL             |
| updated_at | timestamp (tz) | NOT NULL             |

### `branches` table (`branches.ts`)
| Column      | Type           | Constraints                    |
|-------------|----------------|--------------------------------|
| id          | text           | PK, CUID2                      |
| tenant_id   | text           | NOT NULL, FK → tenants.id, idx |
| name        | text           | NOT NULL                       |
| branch_code | text           | NOT NULL                       |
| created_at  | timestamp (tz) | NOT NULL                       |
| updated_at  | timestamp (tz) | NOT NULL                       |

> ⚠️ `branches` does NOT have `is_active` or `deleted_at`.
> Branch validation is by existence only (tenant_id + id).

### `roles` table (`roles.ts`)
| Column      | Type           | Constraints                       |
|-------------|----------------|-----------------------------------|
| id          | text           | PK, CUID2                         |
| tenant_id   | text           | NOT NULL, FK → tenants.id, idx    |
| name        | text           | NOT NULL                          |
| description | text           | nullable                          |
| is_system   | boolean        | NOT NULL, default false           |
| permissions | jsonb          | NOT NULL, default [] — `string[]` |
| created_at  | timestamp (tz) | NOT NULL                          |
| updated_at  | timestamp (tz) | NOT NULL                          |

> `permissions` is a **`string[]` stored as jsonb** — each entry is a permission key
> (e.g. `"hrms.employees.read"`). There is no join table; permissions are embedded in the role.

### `users` table (`users.ts`)
| Column      | Type           | Constraints                    |
|-------------|----------------|--------------------------------|
| id          | text           | PK, CUID2                      |
| tenant_id   | text           | NOT NULL, FK → tenants.id, idx |
| email       | text           | NOT NULL, idx                  |
| password    | text           | NOT NULL                       |
| first_name  | text           | NOT NULL                       |
| last_name   | text           | NOT NULL                       |
| middle_name | text           | nullable                       |
| gender      | text           | nullable                       |
| avatar_url  | text           | nullable                       |
| role_id     | text           | FK → roles.id, idx             |
| created_at  | timestamp (tz) | NOT NULL                       |
| updated_at  | timestamp (tz) | NOT NULL                       |

> ⚠️ `users` has NO `deleted_at` column.
> Do NOT filter with `WHERE deleted_at IS NULL` — that column does not exist.

### `permissions` table (`permissions.ts`)
| Column      | Type           | Constraints                             |
|-------------|----------------|-----------------------------------------|
| id          | text           | PK, CUID2                               |
| tenant_id   | text           | NOT NULL, FK → tenants.id, idx          |
| module_id   | text           | NOT NULL, composite idx (module+action) |
| action      | text           | NOT NULL                                |
| description | text           | nullable                                |
| created_at  | timestamp (tz) | NOT NULL                                |
| updated_at  | timestamp (tz) | NOT NULL                                |

> Registry of valid permission keys per tenant/module.
> Actual grants live in `roles.permissions` (jsonb string[]).
> Do NOT join this table in auth hot paths.

### `module_registry` table (`module-registry.ts`)
| Column     | Type           | Constraints                    |
|------------|----------------|--------------------------------|
| tenant_id  | text           | NOT NULL, FK → tenants.id, idx |
| module_id  | text           | NOT NULL                       |
| is_enabled | boolean        | NOT NULL, default false        |
| created_at | timestamp (tz) | NOT NULL                       |
| updated_at | timestamp (tz) | NOT NULL                       |

> No PK — composite (tenant_id + module_id) is the natural key.

### `sessions` table ← GENERATE THIS

Generate in `libs/core/database/src/lib/schema/auth.schema.ts`.

This table is the source of truth for every active login across all devices.
One row = one device session. Multiple active rows per user = multi-device login.

| Column       | Type           | Constraints                                                        |
|--------------|----------------|--------------------------------------------------------------------|
| id           | text           | PK, CUID2 — this IS the `sessionId` (`sid` claim in the JWT)      |
| user_id      | text           | NOT NULL, FK → users.id, idx                                       |
| tenant_id    | text           | NOT NULL, idx (for fast tenant-scoped queries)                     |
| token_hash   | text           | NOT NULL, UNIQUE idx (sha256 of current raw refresh token)         |
| family       | text           | NOT NULL, idx (CUID2 — shared across rotations of this session)    |
| device_name  | text           | nullable — e.g. "Chrome on macOS", parsed from User-Agent          |
| device_type  | text           | nullable — `'web'`, `'mobile'`, or `'desktop'`                    |
| ip_address   | text           | nullable — IP at time of login                                     |
| last_used_at | timestamp (tz) | NOT NULL, defaultNow() — updated on every token refresh            |
| expires_at   | timestamp (tz) | NOT NULL                                                           |
| revoked_at   | timestamp (tz) | nullable — set on logout or theft detection                        |
| created_at   | timestamp (tz) | NOT NULL, defaultNow()                                             |

> **Why `sessions` instead of `refresh_tokens`**:
> `refresh_tokens` was token-centric — one row per token rotation, ever-growing.
> `sessions` is device-centric — one row per device, token_hash rotates in-place.
> The stable `id` (sessionId) enables device management: list sessions, revoke one,
> revoke all others. The `family` column is retained for theft detection.
> The JWT `sid` claim carries the sessionId so `AuthGuard` can validate the session
> is still active on every request — making logout-all effective immediately.

---

## SECURITY REQUIREMENTS

Apply **every** mitigation in this section. Each one maps to a specific attack vector.

### Complete threat model

| Threat | Mitigation |
|--------|------------|
| XSS token theft | `httpOnly: true` on all cookies |
| CSRF | `sameSite: 'strict'` on all cookies |
| Network sniffing | `secure: true` on all cookies — HTTPS only |
| Refresh token theft | `sha256(rawToken)` stored in DB; raw only ever in cookie |
| Forced logout not propagating | `AuthGuard` validates session is active in DB on every request |
| Session persistence after breach | Family revocation on token replay |
| Tenant spoofing | `x-tenant-id` verified against DB on every authenticated request |
| Cross-tenant data leak | `tenantId` always from DB-verified `req.tenant`, never user input |
| Role escalation | Role read from DB every request — never trusted from JWT |
| JWT algorithm confusion | `algorithms: ['HS256']` pinned in verify — rejects `alg:none` and RS256 |
| Weak JWT secret | Startup assertion: `process.exit(1)` if `JWT_SECRET.length < 64` |
| JWT clock drift (PM2 cluster) | `clockTolerance: 10` seconds in `JwtService.verify()` options |
| Brute force | Per-endpoint named throttler limits (conservative for PM2 2× bypass) |
| Email enumeration on register | Silent 201 regardless of email existence |
| Email enumeration on login | Dummy `argon2.verify()` when user not found — constant response time |
| Large-body DoS | `FastifyAdapter({ bodyLimit: 1_048_576 })` — 1 MB max |
| Clickjacking / MIME sniff / HSTS | `@fastify/helmet` registered before all other middleware |
| Server fingerprinting | Helmet removes `Server` and `X-Powered-By` headers |
| Verbose error leakage | `HttpExceptionFilter` strips stack traces; 5xx logged server-side only |
| Unbounded sessions table | `setInterval` cleanup every 6 hours: DELETE WHERE `expires_at < NOW()` |
| Session fixation | New CUID2 `sessionId` generated on every login — never reused |
| Multi-device token bleed | Each device has its own `family`; theft revokes only that device's family |
| IDOR on session revoke | `DELETE /auth/sessions/:id` verifies `user_id = req.user.userId` |
| IP spoofing via proxy | `extractIp()` reads `X-Forwarded-For` set by Apache `mod_proxy` |

---

### JWT configuration (pin these exactly)

```typescript
// JwtModule.registerAsync — signOptions
signOptions: {
  algorithm: 'HS256',
  expiresIn: '15m',
}

// AuthGuard — JwtService.verify()
this.jwtService.verify<JwtPayload>(token, {
  algorithms: ['HS256'],  // rejects alg:none and RS256 confusion
  clockTolerance: 10,     // 10 s — handles PM2 worker clock skew
});
```

JWT payload shape (exactly this, nothing more):
```typescript
interface JwtPayload {
  sub: string; // userId
  sid: string; // sessionId — ties the token to a specific device row in sessions table
}
```

---

### Startup security assertions

In `main.ts`, before `app.listen()`:
```typescript
const jwtSecret = config.get<string>('JWT_SECRET', '');
if (jwtSecret.length < 64) {
  new Logger('Bootstrap').error('FATAL: JWT_SECRET must be >= 64 characters. Refusing to start.');
  process.exit(1); // NOT throw — process.exit so PM2 marks the worker as failed, not crashed
}
```

---

### Request body limit

```typescript
new FastifyAdapter({ bodyLimit: 1_048_576 }) // 1 MB — set at adapter construction
```

---

### Security headers

```typescript
// main.ts — register FIRST, before cookie plugin and CORS
await app.register(helmet, { contentSecurityPolicy: false }); // API-only; no HTML served
```

Helmet sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Strict-Transport-Security`, `X-DNS-Prefetch-Control`, `Referrer-Policy`.

---

### CORS (complete options)

```typescript
app.enableCors({
  origin: config.get<string>('ALLOWED_ORIGINS', '').split(','),
  credentials: true,                    // required — cookies travel cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-tenant-id'],
  // Do NOT include Authorization — tokens are in httpOnly cookies, not headers
  exposedHeaders: [],
  maxAge: 86400,                        // preflight cache: 24 hours
});
```

---

### Constant-time login response

When user is NOT found in DB, run a dummy verify before returning 401.
Response time must be indistinguishable from a found-but-wrong-password case.

```typescript
// Declared as a module-level constant in auth.service.ts
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$aGVsbG93b3JsZA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

// Inside login()
const user = await this.findUserByEmail(email, tenantId);
if (!user) {
  await argon2.verify(DUMMY_HASH, password).catch(() => {}); // constant-time
  throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
}
```

---

### Session cleanup cron

In `AuthService`, implement `OnModuleInit`:

```typescript
async onModuleInit(): Promise<void> {
  setInterval(async () => {
    await this.db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date().toISOString()));
    this.logger.log('Expired sessions purged');
  }, 6 * 60 * 60 * 1000); // every 6 hours
}
```

---

## SHARED TYPES

Generate in `libs/shared/src/lib/auth.types.ts`:

```typescript
/** JWT payload — minimal. Role is NEVER here. sid is the device session ID. */
interface JwtPayload {
  sub: string; // userId
  sid: string; // sessionId (sessions.id)
}

/** Attached to req.tenant by TenantInterceptor after DB verification */
interface TenantContext {
  tenantId: string;
  branchId?: string;      // Optional — only for branch-scoped modules
  role: string;           // role.name from DB
  permissions: string[];  // role.permissions jsonb array, cast to string[]
}

/** Attached to req.user by AuthGuard after JWT + session DB verification */
interface UserContext {
  userId: string;
  sessionId: string;      // from JWT sid claim
}

/** One active device session, returned to the client in GET /auth/sessions */
interface SessionInfo {
  sessionId: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;     // true if this session matches the caller's req.user.sessionId
}

type ApiSuccess<T> = { success: true; data: T };
type ApiError     = { success: false; error: { message: string; code: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

---

## AUTH DTOs

Generate in `libs/core/auth/src/dto/`:

### `register.dto.ts`
- `firstName`: `@IsString @IsNotEmpty @MaxLength(50)`
- `lastName`: `@IsString @IsNotEmpty @MaxLength(50)`
- `email`: `@IsEmail` + `@Transform(({ value }) => value?.toLowerCase().trim())`
- `password`: `@IsString @MinLength(8) @MaxLength(72)` + `@Matches` regex enforcing uppercase + digit + special char
- `tenantId`: `@IsString @IsNotEmpty`
- `branchId`: `@IsString @IsNotEmpty`

### `login.dto.ts`
- `email`: `@IsEmail` + `@Transform(({ value }) => value?.toLowerCase().trim())`
- `password`: `@IsString @IsNotEmpty`

---

## DEVICE FINGERPRINTING UTILITY

Generate `libs/core/auth/src/utils/device.util.ts`:

```typescript
/**
 * libs/core/auth/src/utils/device.util.ts
 * Parses a coarse device fingerprint from the User-Agent and extracts the real client IP.
 */
import { FastifyRequest } from 'fastify';

export function parseDevice(userAgent: string | undefined): {
  deviceName: string | null;
  deviceType: 'web' | 'mobile' | 'desktop' | null;
} {
  if (!userAgent) return { deviceName: null, deviceType: null };
  const ua = userAgent.toLowerCase();

  let deviceType: 'web' | 'mobile' | 'desktop' = 'web';
  if (/android|iphone|ipad|mobile/.test(ua)) deviceType = 'mobile';
  else if (/electron/.test(ua)) deviceType = 'desktop';

  let browser = 'Unknown browser';
  if (ua.includes('edg/'))     browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome'))  browser = 'Chrome';
  else if (ua.includes('safari'))  browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  let os = 'Unknown OS';
  if (ua.includes('windows'))      os = 'Windows';
  else if (ua.includes('mac os'))  os = 'macOS';
  else if (ua.includes('linux'))   os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceName: `${browser} on ${os}`, deviceType };
}

/**
 * Extracts the real client IP, honouring the X-Forwarded-For header
 * set by Apache mod_proxy sitting in front of NestJS on cPanel.
 */
export function extractIp(request: FastifyRequest): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return raw.split(',')[0].trim();
  }
  return request.ip ?? null;
}
```

---

## THE 7 AUTH ENDPOINTS

### POST /auth/register
**Guard chain**: ThrottlerGuard only (`register` throttler)

**Logic**:
1. Validate DTO (400 if invalid)
2. Check if email exists in `users` WHERE `email = ? AND tenant_id = ?`
3. If exists → `201 { success: true, data: { message: 'If this email is new, you will receive confirmation' } }` — silent
4. Verify branch exists: `branches` WHERE `id = branchId AND tenant_id = tenantId`
5. If not → `404 { code: 'BRANCH_NOT_FOUND' }`
6. Hash password: argon2id, `memoryCost: 65536, timeCost: 3, parallelism: 1`
7. Resolve default `role_id`: `roles` WHERE `is_system = true AND tenant_id = tenantId` LIMIT 1
8. INSERT into `users`
9. Parse device: `parseDevice(request.headers['user-agent'])`; extract IP: `extractIp(request)`
10. Generate raw refresh token = `crypto.randomBytes(64).toString('hex')`; hash = sha256
11. Generate `sessionId` = CUID2; `family` = CUID2
12. INSERT into `sessions`: `{ id: sessionId, userId, tenantId, tokenHash: hash, family, deviceName, deviceType, ipAddress, expiresAt: now + 7 days, lastUsedAt: now }`
13. Sign JWT: `{ sub: userId, sid: sessionId }`, 15 min
14. Set cookies (see Cookie Configuration)
15. Return `201 { success: true, data: { id, email, firstName, lastName } }`

---

### POST /auth/login
**Guard chain**: ThrottlerGuard only (`login` throttler)

**Logic**:
1. Validate DTO
2. Read `x-tenant-id` header → `tenantId`
3. Find user: `users` WHERE `email = ? AND tenant_id = ?`
   > ⚠️ No `deleted_at` filter — column does not exist.
4. If not found → dummy argon2 verify (constant-time) → `401 { code: 'INVALID_CREDENTIALS' }`
5. `argon2.verify(user.password, dto.password)` — if false → `401 { code: 'INVALID_CREDENTIALS' }`
6. If `user.role_id` is null → `403 { code: 'NO_ACTIVE_ROLE' }`
7. Parse device + extract IP
8. Check for an existing active session matching this `userId + deviceName + ipAddress`:
   - SELECT from `sessions` WHERE `user_id = userId AND device_name = deviceName AND ip_address = ip AND revoked_at IS NULL AND expires_at > NOW()` LIMIT 1
   - **If found (returning device)**: rotate its token in-place — generate new raw token → hash → UPDATE `sessions` SET `token_hash = newHash, last_used_at = NOW()` — reuse existing `sessionId` and `family`
   - **If not found (new device)**: generate new `sessionId` (CUID2), `family` (CUID2), raw token; INSERT new `sessions` row
9. Sign JWT: `{ sub: userId, sid: sessionId }`, 15 min
10. Set cookies
11. Return `200 { success: true, data: { id, email, firstName, lastName } }`

---

### POST /auth/refresh
**Guard chain**: ThrottlerGuard only (`refresh` throttler)

**Token rotation with family-based theft detection**:
1. Read raw refresh token from `refresh_token` cookie → if missing: `401 { code: 'REFRESH_TOKEN_MISSING' }`
2. Hash with sha256
3. SELECT from `sessions` WHERE `token_hash = hash`
4. If no record → `401 { code: 'REFRESH_TOKEN_INVALID' }`
5. **Theft detection**: if `revoked_at IS NOT NULL`:
   - UPDATE `sessions` SET `revoked_at = NOW()` WHERE `family = session.family` (revoke entire family)
   - Return `401 { code: 'REFRESH_TOKEN_REUSE_DETECTED' }`
6. If `expires_at < NOW()` → `401 { code: 'REFRESH_TOKEN_EXPIRED' }`
7. Valid path:
   - Generate new raw refresh token → hash
   - UPDATE session: `token_hash = newHash, last_used_at = NOW()`
   - Sign new JWT: `{ sub: session.userId, sid: session.id }` (sessionId is stable)
   - Set both cookies
   - Return `200 { success: true }`

> The `session.id` (sessionId) never changes on rotation — only `token_hash` rotates.
> This keeps the JWT `sid` claim stable for the entire lifetime of the device session.

---

### POST /auth/logout
**Guard chain**: AuthGuard → ThrottlerGuard (`logout` throttler)

**Logic** (revoke current device only):
1. AuthGuard → `req.user = { userId, sessionId }`
2. UPDATE `sessions` SET `revoked_at = NOW()` WHERE `id = req.user.sessionId`
3. Clear cookies: set both with `maxAge: 0`
4. Return `200 { success: true, data: { message: 'Logged out' } }`

---

### POST /auth/logout-all
**Guard chain**: AuthGuard → ThrottlerGuard (`logout-all` throttler)

**Logic** (revoke all sessions for this user across all devices):
1. AuthGuard → `req.user = { userId, sessionId }`
2. UPDATE `sessions` SET `revoked_at = NOW()` WHERE `user_id = req.user.userId AND revoked_at IS NULL`
3. Clear cookies on this response
4. Return `200 { success: true, data: { message: 'All sessions revoked' } }`

> Implement this endpoint. Call it after a password change or suspected compromise.
> Because `AuthGuard` validates the session in DB on every request, all other devices
> will receive `401 { code: 'SESSION_REVOKED' }` on their very next API call —
> even if their access token JWT has not expired yet.

---

### GET /auth/sessions
**Guard chain**: AuthGuard → TenantInterceptor → ThrottlerGuard (`sessions-list` throttler)

**Logic** (session management — list all active devices):
1. AuthGuard → `req.user = { userId, sessionId: callerSessionId }`
2. SELECT from `sessions` WHERE `user_id = userId AND tenant_id = req.tenant.tenantId AND revoked_at IS NULL AND expires_at > NOW()` ORDER BY `last_used_at DESC`
3. Map each row to `SessionInfo`, setting `isCurrent = (row.id === callerSessionId)`
4. Return `200 { success: true, data: SessionInfo[] }`

**Response shape**:
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "cuid2abc",
      "deviceName": "Chrome on macOS",
      "deviceType": "web",
      "ipAddress": "203.0.113.42",
      "lastUsedAt": "2025-05-09T10:30:00Z",
      "createdAt": "2025-05-01T08:00:00Z",
      "isCurrent": true
    },
    {
      "sessionId": "cuid2xyz",
      "deviceName": "Safari on iOS",
      "deviceType": "mobile",
      "ipAddress": "203.0.113.99",
      "lastUsedAt": "2025-05-08T18:00:00Z",
      "createdAt": "2025-04-28T09:15:00Z",
      "isCurrent": false
    }
  ]
}
```

> Never include `token_hash`, `family`, or any internal DB fields in this response.

---

### DELETE /auth/sessions/:sessionId
**Guard chain**: AuthGuard → TenantInterceptor → ThrottlerGuard (`sessions-revoke` throttler)

**Logic** (revoke a specific device — "sign out this device"):
1. AuthGuard → `req.user = { userId, sessionId: callerSessionId }`
2. `targetId` = `:sessionId` route param
3. SELECT session WHERE `id = targetId AND user_id = req.user.userId AND tenant_id = req.tenant.tenantId`
   - If not found → `404 { code: 'SESSION_NOT_FOUND' }` — prevents IDOR
4. UPDATE `sessions` SET `revoked_at = NOW()` WHERE `id = targetId`
5. If `targetId === callerSessionId` (user revoked their own current session): also clear cookies
6. Return `200 { success: true, data: { message: 'Session revoked' } }`

---

### GET /auth/me
**Guard chain**: AuthGuard → TenantInterceptor → ThrottlerGuard (`me` throttler)

#### Strategy: single join query

`TenantInterceptor` has already executed a `users LEFT JOIN roles` query and populated
`req.tenant`. For `/auth/me`, perform ONE additional query to get full profile fields.

```typescript
/**
 * Returns full user profile + role + permissions.
 * Single query: users LEFT JOIN roles.
 * TenantInterceptor has already verified membership; this adds profile fields.
 */
async getMe(userId: string, tenantId: string) {
  const result = await this.db
    .select({
      id:          users.id,
      email:       users.email,
      firstName:   users.firstName,
      lastName:    users.lastName,
      middleName:  users.middleName,
      gender:      users.gender,
      avatarUrl:   users.avatarUrl,
      tenantId:    users.tenantId,
      roleName:    roles.name,
      permissions: roles.permissions,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);

  if (!result.length) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
  const row = result[0];

  return {
    id:         row.id,
    email:      row.email,
    firstName:  row.firstName,
    lastName:   row.lastName,
    middleName: row.middleName,
    gender:     row.gender,
    avatarUrl:  row.avatarUrl,
    tenant: {
      tenantId:    row.tenantId,
      role:        row.roleName ?? null,
      permissions: (row.permissions ?? []) as string[],
    },
  };
}
```

**Response shape**:
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "middleName": null,
    "gender": null,
    "avatarUrl": null,
    "tenant": {
      "tenantId": "acme",
      "role": "Admin",
      "permissions": ["hrms.employees.read", "hrms.employees.write", "finance.reports.read"]
    }
  }
}
```

> Never return `password`, `roleId`, `role.id`, `token_hash`, `family`, or any session internals.

---

## COOKIE CONFIGURATION

```
access_token cookie:
  httpOnly: true
  secure: true
  sameSite: 'strict'
  maxAge: 900000                      ← 15 minutes in ms
  path: '/'

refresh_token cookie:
  httpOnly: true
  secure: true
  sameSite: 'strict'
  maxAge: 604800000                   ← 7 days in ms
  path: '/api/v1/auth/refresh'        ← CRITICAL: must include global prefix
```

> Use `/api/v1/auth/refresh` — not `/auth/refresh`. The global prefix `api/v1` is set
> in `main.ts`. If the cookie path omits the prefix, the browser never sends it to the handler.

---

## GUARDS AND INTERCEPTORS

### `AuthGuard` (`libs/core/auth/src/guards/auth.guard.ts`)
- Implements `CanActivate`
- Extract `access_token` from Fastify cookies — if missing: `UnauthorizedException { code: 'TOKEN_MISSING' }`
- `this.jwtService.verify<JwtPayload>(token, { algorithms: ['HS256'], clockTolerance: 10 })`
- If invalid/expired → `UnauthorizedException { code: 'TOKEN_INVALID' }`
- **Session DB check**: SELECT from `sessions` WHERE `id = payload.sid AND revoked_at IS NULL AND expires_at > NOW()`
  - If not found → `UnauthorizedException { code: 'SESSION_REVOKED' }`
  - This check is what makes `POST /auth/logout-all` take effect on all devices instantly.
- Attach `req.user = { userId: payload.sub, sessionId: payload.sid }`
- Return `true`

### `TenantInterceptor` (`libs/core/auth/src/interceptors/tenant.interceptor.ts`)
- Implements `NestInterceptor`
- Read `x-tenant-id` header — if missing: `ForbiddenException { code: 'TENANT_ID_MISSING' }`
- Single query: `users LEFT JOIN roles` WHERE `users.id = req.user.userId AND users.tenant_id = x-tenant-id`
  > ⚠️ No `deleted_at` filter — column does not exist on `users`.
- If no record → `ForbiddenException { code: 'NOT_A_MEMBER' }`
- If `role_id` null or join returns no role → `ForbiddenException { code: 'NO_ACTIVE_ROLE' }`
- Attach:
  ```typescript
  req.tenant = {
    tenantId:    user.tenantId,
    role:        role.name,
    permissions: role.permissions as string[],
  };
  ```
- Call `next.handle()`

### `RoleGuard` (`libs/core/auth/src/guards/role.guard.ts`)
- Reads `@Roles(...)` metadata via `Reflector`
- If no metadata → `true`
- Check `req.tenant.role` is in required roles array
- If not → `ForbiddenException { code: 'INSUFFICIENT_ROLE' }`

### Decorators
- `@Roles(...)` — `SetMetadata('roles', roles)`
- `@CurrentUser()` — `createParamDecorator` → `req.user`
- `@CurrentTenant()` — `createParamDecorator` → `req.tenant`

---

## RATE LIMITING CONFIGURATION

Named throttlers in `auth.module.ts`. Limits account for PM2 2× bypass.

```
register:        ttl=3600s, limit=5
login:           ttl=900s,  limit=10
refresh:         ttl=60s,   limit=20
logout:          ttl=60s,   limit=5
logout-all:      ttl=60s,   limit=3
sessions-list:   ttl=60s,   limit=30
sessions-revoke: ttl=60s,   limit=10
me:              ttl=60s,   limit=60
```

Apply per-route with `@Throttle({ [name]: { ttl, limit } })`.

---

## DRIZZLE SERVICE

Generate `libs/core/database/src/lib/database.service.ts`:
- `@neondatabase/serverless` HTTP driver — NOT `postgres` or `pg`
- `neon(process.env.DATABASE_URL)` → `drizzle(sql, { schema })`
- Import full schema from `./schema/index.ts`
- `@Injectable()` with NestJS lifecycle hooks
- Log on init: `"Database connected (Neon HTTP driver)"`
- `onModuleDestroy`: `"Database service destroyed"`

---

## DRIZZLE MIGRATIONS

- `drizzle.config.ts` at project root: `dialect: 'postgresql'`, schema path, output path
- `package.json` scripts: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`

---

## ERROR HANDLING

Global `HttpExceptionFilter` in `libs/core/auth/src/filters/http-exception.filter.ts`:
- Catches `HttpException`
- Returns: `{ "success": false, "error": { "message": "...", "code": "..." } }`
- Extract `code` from exception response if present; else derive from HTTP status.
- Log all 5xx errors server-side with full stack via `Logger`. Never in response body.
- Strip all internal details (DB errors, stack traces) from client responses.

---

## AUTH MODULE WIRING

`libs/core/auth/src/auth.module.ts`:
- Import `DrizzleModule`
- Import `JwtModule.registerAsync` with `ConfigService` → `secret`, `signOptions: { algorithm: 'HS256', expiresIn: '15m' }`
- Import `ThrottlerModule` with all named throttlers above
- Import `ConfigModule`
- Provide and export: `AuthGuard`, `TenantInterceptor`, `RoleGuard`
- Register `HttpExceptionFilter` as global via `APP_FILTER`
- Register `ThrottlerGuard` as global via `APP_GUARD`
- Register `ValidationPipe` globally: `whitelist: true, forbidNonWhitelisted: true, transform: true`

---

## APP BOOTSTRAP

`apps/api-gateway/src/main.ts`:
```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ bodyLimit: 1_048_576 }),
);

// 1. Security headers — register FIRST
await app.register(helmet, { contentSecurityPolicy: false });

// 2. JWT secret assertion — crash before binding port
const config = app.get(ConfigService);
const jwtSecret = config.get<string>('JWT_SECRET', '');
if (jwtSecret.length < 64) {
  new Logger('Bootstrap').error('FATAL: JWT_SECRET must be >= 64 characters. Refusing to start.');
  process.exit(1);
}

// 3. Cookie support
await app.register(fastifyCookie);

// 4. CORS
app.enableCors({
  origin: config.get<string>('ALLOWED_ORIGINS', '').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-tenant-id'],
  maxAge: 86400,
});

app.setGlobalPrefix('api/v1');
app.enableShutdownHooks();
await app.listen(config.get<number>('PORT', 3001), '0.0.0.0');
```

---

## ENVIRONMENT VARIABLES

`.env.example`:
```
# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT — server refuses to start if shorter than 64 characters
JWT_SECRET=replace-this-with-a-minimum-64-character-random-string-in-production!!

# Sessions
REFRESH_TOKEN_EXPIRES_DAYS=7

# Server
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## PM2 CONFIGURATION

`config/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'business-os-api',
    script: 'dist/apps/api-gateway/main.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    env_production: { NODE_ENV: 'production', PORT: 3001 },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    restart_delay: 3000,
    max_restarts: 10,
  }]
};
```

---

## APACHE .HTACCESS PROXY

`config/.htaccess`:
```apache
# Apache mod_proxy must be enabled on the cPanel server.
# HTTPS terminates at Apache. NestJS sees plain HTTP on port 3001.
# X-Forwarded-For is passed so extractIp() can log real client IPs.
RewriteEngine On
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
Header set X-Forwarded-Proto "https"
```

---

## PACKAGE.JSON DEPENDENCIES

**Core**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`, `@fastify/cookie`, `@fastify/helmet`, `@nestjs/jwt`, `@nestjs/config`, `@nestjs/throttler`

**Database**: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `@paralleldrive/cuid2`

**Auth / Security**: `argon2` (WASM), `class-validator`, `class-transformer`

**Build / Dev**: `@nx/js`, `typescript`, `ts-node`; `pm2` installed globally on server

---

## FILE OUTPUT CHECKLIST

```
libs/
  core/
    database/src/lib/
      schema/
        auth.schema.ts              ← sessions table only (all other tables already exist)
      database.service.ts
      database.module.ts
    auth/src/
      dto/
        register.dto.ts
        login.dto.ts
      guards/
        auth.guard.ts               ← JWT verify + session DB check → req.user
        role.guard.ts
      interceptors/
        tenant.interceptor.ts       ← x-tenant-id → users+roles join → req.tenant
      decorators/
        current-user.decorator.ts
        current-tenant.decorator.ts
        roles.decorator.ts
      filters/
        http-exception.filter.ts
      utils/
        device.util.ts              ← parseDevice(), extractIp()
      auth.service.ts               ← register, login, refresh, logout, logoutAll,
                                       getSessions, revokeSession, getMe, cleanup cron
      auth.controller.ts            ← 7 routes + GET /health
      auth.module.ts
  shared/src/lib/
    auth.types.ts                   ← JwtPayload (with sid), TenantContext, UserContext, SessionInfo
apps/
  api-gateway/src/
    main.ts                         ← bodyLimit, helmet, JWT assertion, cookie, CORS
config/
  ecosystem.config.js
  .htaccess
.env.example
drizzle.config.ts
```

---

## FINAL INSTRUCTIONS TO THE AI

1. Output every file in full. No `// ... rest of implementation` placeholders.
2. Every file starts with a comment block: file path + one-line purpose.
3. All imports must be complete and correct.
4. Use `ConfigService` for all env vars in service/guard files. Only `process.env` in `main.ts` startup assertions.
5. argon2 options: `{ memoryCost: 65536, timeCost: 3, parallelism: 1, type: argon2.argon2id }`.
6. sha256: `createHash('sha256').update(raw).digest('hex')` via Node built-in `crypto`.
7. All Drizzle queries use operators (`eq`, `and`, `isNull`, `gt`, `lt`) — no raw SQL strings.
8. Cookie path for refresh token must be `/api/v1/auth/refresh` (includes global prefix).
9. `TenantInterceptor` executes one `users LEFT JOIN roles` query — never two separate queries.
10. `permissions` cast explicitly to `string[]` at every point of use — Drizzle returns `unknown` for jsonb at runtime.
11. All error throws use NestJS built-ins: `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `BadRequestException`.
12. Apply `@UseGuards(AuthGuard)` and `@UseInterceptors(TenantInterceptor)` explicitly on each route that requires them.
13. `/auth/me` response includes `tenant: { tenantId, role, permissions: string[] }`.
14. On refresh token reuse detection, revoke the **entire family** — all sessions sharing that `family` value.
15. Do not use `express` anywhere. Everything must be Fastify-compatible.
16. `GET /health` returns `{ status: 'ok', timestamp: new Date().toISOString() }` — no guards, no auth.
17. **Do NOT reference `deleted_at` on `users`** — column does not exist.
18. **Do NOT reference `is_active` on `branches`** — column does not exist.
19. The `permissions` table is a registry only — do not join it in hot paths.
20. `branches` has a `branch_code` column — include in schema and branch-lookup queries.
21. **`sessions` replaces `refresh_tokens`** entirely. Do not generate a `refresh_tokens` table or any reference to it anywhere.
22. `AuthGuard` MUST query the `sessions` table (not just verify the JWT) to check `revoked_at IS NULL AND expires_at > NOW()`. This is the mechanism that makes `POST /auth/logout-all` take effect on all devices immediately.
23. The `session.id` (sessionId / `sid`) never changes on token rotation — only `token_hash` rotates. The JWT `sid` claim is stable for the device's lifetime.
24. `DELETE /auth/sessions/:sessionId` must verify `user_id = req.user.userId` before revoking — prevents IDOR.
25. `extractIp()` reads `X-Forwarded-For` first (set by Apache), then falls back to `request.ip`.
26. Register `@fastify/helmet` as the very first plugin in `main.ts` before cookie, CORS, or any other middleware.
27. The JWT secret startup check must call `process.exit(1)` — not throw — so PM2 marks the worker as failed rather than restarting it in an infinite crash loop with a bad secret.
28. `AuthService` must implement `OnModuleInit` and start the 6-hour session cleanup interval there.
29. Login deduplication (step 8 in `/auth/login`): match on `userId + deviceName + ipAddress`. If a non-revoked, non-expired session already exists for that combination, rotate its token in-place rather than creating a duplicate row.
30. `DUMMY_HASH` for constant-time login must be declared as a module-level constant in `auth.service.ts`, not computed at runtime, so it is available immediately on the first failed login without any async overhead.