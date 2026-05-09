# BUSINESS OS — AUTH MODULE CODE GENERATION PROMPT

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

| Concern          | Choice                                      | Reason                                      |
|------------------|---------------------------------------------|---------------------------------------------|
| Monorepo         | Nx Integrated Workspace                     | Enforced boundaries between libs and apps   |
| Framework        | NestJS with **Fastify adapter** (not Express)| Lower memory — critical for shared hosting  |
| ORM              | Drizzle ORM                                 | Lightweight, type-safe, no connection pool  |
| Database         | PostgreSQL via **Neon serverless HTTP driver**| No persistent TCP — perfect for cPanel/PM2  |
| Primary Keys     | CUID2 (`@paralleldrive/cuid2`)              | Non-guessable, DB-index friendly            |
| Password hashing | `argon2` (WASM build — no native compile)   | Works on shared hosting without build tools |
| JWT              | `@nestjs/jwt`                               | Standard NestJS integration                 |
| Validation       | `class-validator` + `class-transformer`     | DTO-level input validation                  |
| Rate limiting    | `@nestjs/throttler` (in-memory storage)     | No Redis required                           |
| Process manager  | PM2 (cluster mode, max 2 instances)         | cPanel shared hosting compatible            |

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

---

## GLOBAL CODING STANDARDS

Apply these rules to every single file you generate.

1. **Naming**: `snake_case` in all PostgreSQL identifiers. `camelCase` in all TypeScript.
2. **Soft deletes**: Optional. Use `deleted_at` only where required. Never use hard deletes on primary data.
3. **Response envelope**: Every API response must return one of:
   - Success: `{ success: true, data: T }`
   - Error:   `{ success: false, error: { message: string, code: string } }`
4. **Primary keys**: Always CUID2 via `idColumn` util.
5. **No secrets in code**: All secrets come from `process.env` via `ConfigService`.
6. **Timestamps**: Every table has `created_at`, `updated_at` via `auditColumns` util.
7. **Role is never in the JWT**: The JWT payload contains only `{ sub: userId }`.
   Role and Permissions are always read fresh from the `users` and `roles` table on every request.
8. **No hard-coding tenant or branch IDs** anywhere in the codebase.
9. **Every Drizzle query** must be scoped with `tenantId` (and `branchId` if the table supports it).
10. **Never return the password hash** in any response, ever.
11. Use `async/await` throughout. No raw `.then()` chains.
12. Every service method must have a JSDoc comment explaining what it does.
13. Every file must have a top-level comment block stating its purpose.

---

## MULTI-TENANCY RULES

- Model: **Shared schema, column-based** multi-tenancy.
- Every operational table MUST have a `tenant_id` column. `branch_id` is optional and module-dependent.
- The `x-tenant-id` custom HTTP header carries the tenant context from the client.
- The `TenantInterceptor` verifies this header against the `memberships` table in the DB.
- The result is attached to `req.tenant = { tenantId, branchId, role }`.
- **The header alone is never trusted** — the DB membership check is mandatory on every request.

---

## SECURITY REQUIREMENTS

| Threat                    | Mitigation                                                                 |
|---------------------------|----------------------------------------------------------------------------|
| XSS token theft           | `httpOnly: true` on all cookies — JS cannot read them                     |
| CSRF                      | `sameSite: 'strict'` on all cookies                                       |
| Network sniffing          | `secure: true` on all cookies — HTTPS only                                |
| Refresh token theft       | Token stored as `sha256(rawToken)` in DB. Raw value only ever in cookie.  |
| Session persistence after breach | Token family revocation — see Refresh Token Rotation below         |
| Tenant spoofing           | `x-tenant-id` verified against `memberships` on every request             |
| Cross-tenant data leak    | `branchId` sourced from `req.tenant` (DB-verified), never from user input |
| Role escalation           | Role read from DB every request, never trusted from JWT                   |
| Brute force               | Per-endpoint throttle limits (see Rate Limiting section)                  |
| Email enumeration         | Register returns `201` whether email exists or not — check is silent      |

---

## DATABASE SCHEMA

Generate these 5 tables in `libs/core/database/src/lib/schema/auth.schema.ts`
using Drizzle ORM with the `drizzle-orm/pg-core` module.

### Table: `tenants`
| Column      | Type      | Constraints              |
|-------------|-----------|--------------------------|
| id          | text      | PK                       |
| name        | text      | NOT NULL                 |
| slug        | text      | NOT NULL, UNIQUE index   |
| branding    | jsonb     | NOT NULL, default {}     |
| created_at  | timestamp | NOT NULL, defaultNow()   |
| updated_at  | timestamp | NOT NULL, defaultNow()   |

### Table: `branches`
| Column      | Type      | Constraints                       |
|-------------|-----------|-----------------------------------|
| id          | text      | PK, CUID2 default                 |
| tenant_id   | text      | NOT NULL, FK → tenants.id, index  |
| name        | text      | NOT NULL                          |
| is_active   | boolean   | NOT NULL, default true            |
| created_at  | timestamp | NOT NULL, defaultNow()            |
| updated_at  | timestamp | NOT NULL, defaultNow()            |
| deleted_at  | timestamp | nullable                          |

### Table: `users`
| Column            | Type      | Constraints            |
|-------------------|-----------|------------------------|
| id                | text      | PK, CUID2              |
| tenant_id         | text      | NOT NULL, FK → tenants |
| email             | text      | NOT NULL, UNIQUE index |
| password          | text      | NOT NULL               |
| first_name        | text      | NOT NULL               |
| last_name         | text      | NOT NULL               |
| middle_name       | text      | nullable               |
| gender            | text      | nullable               |
| avatar_url        | text      | nullable               |
| role_id           | text      | FK → roles.id          |
| created_at        | timestamp | NOT NULL, defaultNow() |
| updated_at        | timestamp | NOT NULL, defaultNow() |

### Table: `roles`
| Column      | Type      | Constraints                               |
|-------------|-----------|-------------------------------------------|
| id          | text      | PK, CUID2                                 |
| tenant_id   | text      | NOT NULL, FK → tenants.id                 |
| name        | text      | NOT NULL                                  |
| description | text      | nullable                                  |
| is_system   | boolean   | NOT NULL, default false                   |
| permissions | jsonb     | NOT NULL, default [] (string array)       |
| created_at  | timestamp | NOT NULL, defaultNow()                    |
| updated_at  | timestamp | NOT NULL, defaultNow()                    |

### Table: `permissions`
| Column      | Type      | Constraints                               |
|-------------|-----------|-------------------------------------------|
| id          | text      | PK, CUID2                                 |
| tenant_id   | text      | NOT NULL, FK → tenants.id                 |
| module_id   | text      | NOT NULL                                  |
| action      | text      | NOT NULL                                  |
| description | text      | nullable                                  |
| created_at  | timestamp | NOT NULL, defaultNow()                    |
| updated_at  | timestamp | NOT NULL, defaultNow()                    |

### Table: `refresh_tokens`
Server-side token registry enabling revocation without Redis.
| Column      | Type      | Constraints                              |
|-------------|-----------|------------------------------------------|
| id          | text      | PK, CUID2 default                        |
| user_id     | text      | NOT NULL, FK → users.id, index           |
| token_hash  | text      | NOT NULL, UNIQUE index (sha256 of raw)   |
| family      | text      | NOT NULL, index (CUID2, shared per chain)|
| expires_at  | timestamp | NOT NULL                                 |
| revoked_at  | timestamp | nullable                                 |
| created_at  | timestamp | NOT NULL, defaultNow()                   |

Export TypeScript inferred types for all tables: `User`, `Tenant`, `Branch`, `Membership`.

---

## SHARED TYPES

Generate in `libs/shared/src/lib/auth.types.ts`:

```typescript
// JWT payload — keep minimal. Role is NEVER here.
interface JwtPayload {
  sub: string; // userId only
}

// Attached to req.tenant by TenantInterceptor after DB verification
interface TenantContext {
  tenantId: string;
  branchId?: string; // Optional — only for branch-scoped modules
  role: string;
  permissions: string[];
}

// Attached to req.user by AuthGuard after JWT verification
interface UserContext {
  userId: string;
}

// Standard API response wrappers
type ApiSuccess<T> = { success: true; data: T };
type ApiError     = { success: false; error: { message: string; code: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

---

## AUTH DTOs

Generate in `libs/core/auth/src/dto/`:

### `register.dto.ts`
Fields with class-validator decorators:
- `firstName`: string, not empty, max 50 chars
- `lastName`: string, not empty, max 50 chars
- `email`: valid email format, lowercase transform
- `password`: string, min 8 chars, max 72 chars, must contain uppercase + number + special char
- `tenantId`: string, not empty (which tenant they're joining)
- `branchId`: string, not empty (which branch they're assigned to)

### `login.dto.ts`
Fields:
- `email`: valid email, lowercase transform
- `password`: string, not empty

---

## THE 5 AUTH ENDPOINTS

### POST /auth/register
**Guard chain**: ThrottlerGuard only (5 requests / 1 hour per IP)

**Logic**:
1. Validate DTO (400 if invalid)
2. Check email already exists in `users` table
3. If exists → still return 201 with `{ success: true, data: { message: 'If this email is new, you will receive confirmation' } }` — never reveal whether email exists
4. Verify the `tenantId` + `branchId` combination exists and is active in `branches` table
5. If not → 404 `{ code: 'BRANCH_NOT_FOUND' }`
6. Hash password with argon2 (use WASM, options: `memoryCost: 65536, timeCost: 3, parallelism: 1`)
7. INSERT into `users` table (include `role_id` and `tenant_id`)
8. Ensure user has a valid role assigned (default or as specified)
9. Generate access token (JWT, 15 min expiry, payload `{ sub: userId }`)
10. Generate refresh token (raw = `crypto.randomBytes(64).toString('hex')`)
11. Hash raw refresh token with `sha256`
12. Generate a `family` id using CUID2
13. INSERT into `refresh_tokens` (store hashed, with family id, expires in 7 days)
14. Set two HTTP-only cookies (see Cookie Config section)
15. Return `201 { success: true, data: { id, email, firstName, lastName } }`

### POST /auth/login
**Guard chain**: ThrottlerGuard only (10 requests / 15 min per IP)

**Logic**:
1. Validate DTO
2. Find user by email in `users` table where `deleted_at IS NULL`
3. If not found → `401 { code: 'INVALID_CREDENTIALS' }` (never say "email not found")
4. Verify password with `argon2.verify(storedHash, incomingPassword)`
5. If invalid → `401 { code: 'INVALID_CREDENTIALS' }`
6. Check user has an assigned `tenant_id` and `role_id`
7. If no active membership/role → `403 { code: 'NO_ACTIVE_ROLE' }`
8. Generate access token + refresh token (same as register steps 9–13)
9. Set cookies, return `200 { success: true, data: { id, email, firstName, lastName } }`

### POST /auth/refresh
**Guard chain**: ThrottlerGuard only (20 requests / 1 min per IP)

**Token Rotation with Family-Based Theft Detection**:
1. Extract raw refresh token from `refresh_token` cookie
2. If no cookie → `401 { code: 'REFRESH_TOKEN_MISSING' }`
3. Hash the raw token with sha256
4. Lookup in `refresh_tokens` WHERE `token_hash = hash AND expires_at > NOW()`
5. If no record found → `401 { code: 'REFRESH_TOKEN_INVALID' }`
6. **CRITICAL — theft detection**: If record found but `revoked_at IS NOT NULL`:
   - This token was already rotated — it's being reused.
   - Immediately revoke ALL tokens in the same `family` (set `revoked_at = NOW()`)
   - Return `401 { code: 'REFRESH_TOKEN_REUSE_DETECTED' }`
7. If record is valid (not revoked, not expired):
   - Set `revoked_at = NOW()` on the current token
   - Generate new raw refresh token
   - INSERT new `refresh_tokens` record with **same `family` id**
   - Generate new access token JWT
   - Set both cookies
   - Return `200 { success: true }`

### POST /auth/logout
**Guard chain**: AuthGuard → ThrottlerGuard (5 requests / 1 min)

**Logic**:
1. AuthGuard validates the access token cookie, attaches `req.user`
2. Extract raw refresh token from cookie
3. If present: hash it, find in DB, set `revoked_at = NOW()`
4. Also revoke ALL tokens in the same family (logout all sessions)
5. Clear both cookies (set them with `maxAge: 0`)
6. Return `200 { success: true, data: { message: 'Logged out' } }`

### GET /auth/me
**Guard chain**: AuthGuard → TenantInterceptor → ThrottlerGuard (60 req / 1 min)

**Logic**:
1. AuthGuard validates JWT cookie → attaches `req.user = { userId }`
2. TenantInterceptor reads `x-tenant-id` header → verifies membership in DB → attaches `req.tenant`
3. Fetch user from `users` table by `req.user.userId` where `deleted_at IS NULL`
4. If not found → `404 { code: 'USER_NOT_FOUND' }`
5. Return `200 { success: true, data: { id, email, firstName, lastName, tenant: req.tenant } }`
6. Never return `password_hash`

---

## COOKIE CONFIGURATION

All cookies use these exact settings:

```
access_token cookie:
  httpOnly: true
  secure: true          ← HTTPS only, always
  sameSite: 'strict'
  maxAge: 900000        ← 15 minutes in milliseconds
  path: '/'

refresh_token cookie:
  httpOnly: true
  secure: true
  sameSite: 'strict'
  maxAge: 604800000     ← 7 days in milliseconds
  path: '/auth/refresh' ← CRITICAL: scoped so browser never sends it to other routes
```

---

## GUARDS AND INTERCEPTORS

### `AuthGuard` (`libs/core/auth/src/guards/auth.guard.ts`)
- Implements `CanActivate`
- Extracts `access_token` from Fastify request cookies
- If missing → throw `UnauthorizedException` with `{ code: 'TOKEN_MISSING' }`
- Verify with `JwtService.verify(token)`
- If invalid or expired → throw `UnauthorizedException` with `{ code: 'TOKEN_INVALID' }`
- Attach `req.user = { userId: payload.sub }`
- Return `true`

### `TenantInterceptor` (`libs/core/auth/src/interceptors/tenant.interceptor.ts`)
- Implements `NestInterceptor`
- Reads `x-tenant-id` from request headers
- If missing → throw `ForbiddenException` with `{ code: 'TENANT_ID_MISSING' }`
- Uses `DrizzleService` to query `users` table (joining with `roles`):
  ```
  WHERE id = req.user.userId
    AND tenant_id = x-tenant-id header value
  ```
- If no record → throw `ForbiddenException` with `{ code: 'NOT_A_MEMBER' }`
- Attach `req.tenant = { tenantId, role: role.name, permissions: role.permissions }` from the user/role records
- Call `next.handle()` to continue

### `RoleGuard` (`libs/core/auth/src/guards/role.guard.ts`)
- Implements `CanActivate`
- Uses `Reflector` to read `@Roles(...)` metadata from handler/class
- If no metadata → return `true` (route is open to all authenticated members)
- Check `req.tenant.role` is included in the required roles array
- If not → throw `ForbiddenException` with `{ code: 'INSUFFICIENT_ROLE' }`

### `@Roles()` Decorator (`libs/core/auth/src/decorators/roles.decorator.ts`)
- `SetMetadata('roles', roles)` decorator factory

### `@CurrentUser()` Decorator (`libs/core/auth/src/decorators/current-user.decorator.ts`)
- `createParamDecorator` that returns `req.user`

### `@CurrentTenant()` Decorator (`libs/core/auth/src/decorators/current-tenant.decorator.ts`)
- `createParamDecorator` that returns `req.tenant`

---

## RATE LIMITING CONFIGURATION

Configure `ThrottlerModule` globally in `auth.module.ts` with named throttlers:

```
register:  ttl=3600s,  limit=5    (5 attempts per hour per IP)
login:     ttl=900s,   limit=10   (10 attempts per 15 min per IP)
refresh:   ttl=60s,    limit=20   (20 attempts per minute per IP)
logout:    ttl=60s,    limit=5
me:        ttl=60s,    limit=60
```

Apply the correct named throttler to each route using `@Throttle({ [name]: { ... } })`.

---

## DRIZZLE SERVICE

Generate `libs/core/database/src/lib/database.service.ts`:
- Uses `@neondatabase/serverless` HTTP driver (not `postgres` or `pg`)
- `neon(process.env.DATABASE_URL)` → `drizzle(sql, { schema })`
- Inject via NestJS `@Injectable()`
- Log on init: "Database connected (Neon HTTP driver)"
- `onModuleDestroy`: log "Database service destroyed" (no connection to close with HTTP driver)
- Export `db` property typed as the Drizzle instance with full schema

---

## DRIZZLE MIGRATIONS

Generate `libs/core/database/src/lib/migrations/`:
- `drizzle.config.ts` at project root pointing to the schema file
- Config: `dialect: 'postgresql'`, schema path, output to `libs/core/database/src/lib/migrations/`
- Include a `package.json` script: `"db:generate": "drizzle-kit generate"` and `"db:migrate": "drizzle-kit migrate"`

---

## ERROR HANDLING

Generate a global `HttpExceptionFilter` in `libs/core/auth/src/filters/http-exception.filter.ts`:
- Implements `ExceptionFilter`
- Catches `HttpException`
- Always returns the standard error envelope:
  ```json
  { "success": false, "error": { "message": "...", "code": "..." } }
  ```
- If the exception has a `code` in its response object, use it. Otherwise derive from HTTP status.
- Log all 5xx errors with the full stack trace using NestJS `Logger`.
- Never expose stack traces in the response body.

---

## AUTH MODULE WIRING

Generate `libs/core/auth/src/auth.module.ts`:
- Import `DrizzleModule` (provides `DrizzleService`)
- Import `JwtModule.registerAsync` using `ConfigService` for `secret` and `signOptions: { expiresIn: '15m' }`
- Import `ThrottlerModule` with the named throttlers above
- Import `ConfigModule`
- Provide and export: `AuthGuard`, `TenantInterceptor`, `RoleGuard`
- Register the `HttpExceptionFilter` as a global filter using `APP_FILTER`
- Register `ThrottlerGuard` as a global guard using `APP_GUARD`
- Register `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true, transform: true`

---

## APP BOOTSTRAP

Generate `apps/api-gateway/src/main.ts`:
- Use `NestFastifyApplication` with `FastifyAdapter`
- Register `@fastify/cookie` plugin (for HTTP-only cookie support)
- Enable CORS with:
  - `origin`: from `ALLOWED_ORIGINS` env var (comma-separated)
  - `credentials: true` (required for cookies)
  - Allowed headers: `Content-Type`, `Authorization`, `x-tenant-id`
- Set global prefix: `api/v1`
- Enable graceful shutdown hooks
- Log the port on start

---

## ENVIRONMENT VARIABLES

Generate `.env.example` at the project root:
```
# Database (Neon serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT
JWT_SECRET=minimum-64-character-random-string-change-this-in-production
JWT_EXPIRES_IN=15m

# Refresh token
REFRESH_TOKEN_EXPIRES_DAYS=7

# Server
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## PM2 CONFIGURATION

Generate `config/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'business-os-api',
    script: 'dist/apps/api-gateway/main.js',
    instances: 2,           // max for shared hosting memory
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
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

Generate `config/.htaccess` (place in the public_html directory on cPanel):
```apache
RewriteEngine On
RewriteRule ^api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
```
Add a comment explaining: Apache `mod_proxy` must be enabled on the cPanel server.
All HTTPS termination happens at Apache. NestJS only ever sees plain HTTP on 3001.

---

## PACKAGE.JSON DEPENDENCIES

List the exact packages to install:

**Core**:
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`
- `@fastify/cookie`
- `@nestjs/jwt`, `@nestjs/config`, `@nestjs/throttler`

**Database**:
- `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
- `@paralleldrive/cuid2`

**Auth / Security**:
- `argon2` (WASM mode — no native build)
- `class-validator`, `class-transformer`

**Build / Dev**:
- `@nx/js`, `typescript`, `ts-node`
- `pm2` (global install on server)

---

## FILE OUTPUT CHECKLIST

Generate ALL of these files. Do not skip any:

```
libs/
  core/
    database/src/lib/
      schema/
        auth.schema.ts              ← 5 tables, CUID2 PKs, soft-delete
      database.service.ts           ← Neon HTTP driver, DrizzleService
      database.module.ts            ← NestJS module exporting DrizzleService
    auth/src/
      dto/
        register.dto.ts             ← class-validator, email normalisation
        login.dto.ts
      guards/
        auth.guard.ts               ← JWT cookie → req.user
        role.guard.ts               ← req.tenant.role vs @Roles()
      interceptors/
        tenant.interceptor.ts       ← x-tenant-id → DB check → req.tenant
      decorators/
        current-user.decorator.ts
        current-tenant.decorator.ts
        roles.decorator.ts
      filters/
        http-exception.filter.ts    ← global error envelope
      auth.service.ts               ← register, login, refresh, logout, me logic
      auth.controller.ts            ← 5 routes, cookie config, throttle decorators
      auth.module.ts                ← full wiring, global providers
  shared/src/lib/
    auth.types.ts                   ← JwtPayload, TenantContext, ApiResponse types
apps/
  api-gateway/src/
    main.ts                         ← Fastify bootstrap, CORS, global prefix
config/
  ecosystem.config.js               ← PM2 cluster config
  .htaccess                         ← Apache mod_proxy rewrite
.env.example                        ← all required env vars with comments
drizzle.config.ts                   ← Drizzle Kit config pointing to schema
```

---

## FINAL INSTRUCTIONS TO THE AI

1. Output every file in full. No placeholders like `// ... rest of implementation`.
2. Every file starts with a comment block: file path + one-line purpose.
3. All imports must be complete and correct — no missing imports.
4. Use `@nestjs/config` `ConfigService` for every environment variable access.
5. argon2 options must be: `{ memoryCost: 65536, timeCost: 3, parallelism: 1, type: argon2.argon2id }`.
6. The `sha256` hash of the refresh token must use Node's built-in `crypto` module: `createHash('sha256').update(raw).digest('hex')`.
7. In `auth.service.ts`, all DB queries must use `drizzle-orm` operators: `eq()`, `and()`, `isNull()`, `gt()` — never raw SQL strings.
8. Cookie options must exactly match the Cookie Configuration section above.
9. The `TenantInterceptor` must always verify `branch_id` belongs to `tenant_id` — never trust the membership record alone without this cross-check.
10. All error throws must use NestJS built-in exceptions: `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `BadRequestException`.
11. Apply `@UseGuards(AuthGuard)` and `@UseInterceptors(TenantInterceptor)` explicitly on routes that need them — do not rely only on global registration.
12. The response from `/auth/me` must include the full `TenantContext` under a `tenant` key.
13. On refresh token reuse detection, revoke the ENTIRE family, not just the presented token.
14. Do not use `express` anywhere. Everything must be Fastify-compatible.
15. Add a `HealthController` at `GET /health` that returns `{ status: 'ok', timestamp: new Date().toISOString() }` — no guards, no auth. Used by PM2 and cPanel to check the process is alive.