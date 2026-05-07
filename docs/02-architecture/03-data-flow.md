# Data Flow — End-to-End Login Trace

This document traces a single login request from the moment the user clicks **Sign in** to the moment the workspace dashboard renders. Each step is annotated with the file responsible, the data shape at that point, and the "why" behind the design choice.

## Table of Contents

- [Overview Diagram](#overview-diagram)
- [Step 1 — User Submits LoginForm](#step-1--user-submits-loginform)
- [Step 2 — useAuth().login() Initiates the Fetch](#step-2--useauthlogin-initiates-the-fetch)
- [Step 3 — Next.js Rewrite Proxies to the Gateway](#step-3--nextjs-rewrite-proxies-to-the-gateway)
- [Step 4 — JwtAuthGuard Skips Auth for @Public Routes](#step-4--jwtauthguard-skips-auth-for-public-routes)
- [Step 5 — ValidationPipe Validates LoginDto](#step-5--validationpipe-validates-logindto)
- [Step 6 — AuthController Delegates to AuthService](#step-6--authcontroller-delegates-to-authservice)
- [Step 7 — StaticUserRepository Looks Up the User](#step-7--staticuserrepository-looks-up-the-user)
- [Step 8 — bcrypt Verifies the Password](#step-8--bcrypt-verifies-the-password)
- [Step 9 — Token Issued, Session Stored in Memory](#step-9--token-issued-session-stored-in-memory)
- [Step 10 — TransformInterceptor Wraps the Response](#step-10--transforminterceptor-wraps-the-response)
- [Step 11 — Browser Receives the ApiResponse Envelope](#step-11--browser-receives-the-apiresponse-envelope)
- [Step 12 — AuthProvider Stores Token and User](#step-12--authprovider-stores-token-and-user)
- [Step 13 — Hard Navigation to the Workspace](#step-13--hard-navigation-to-the-workspace)
- [Step 14 — getServerSession Reads Cookie and Calls /api/auth/me](#step-14--getserversession-reads-cookie-and-calls-apiauthme)
- [Step 15 — WorkspacePage Renders](#step-15--workspacepage-renders)

---

## Overview Diagram

```
Browser                    Next.js (port 3000)         NestJS (port 3001)         PostgreSQL
  │                              │                            │                       │
  │  submit LoginForm            │                            │                       │
  ├─────────────────────────────►│                            │                       │
  │                              │  POST /api/auth/login      │                       │
  │                              │  (rewrite → :3001)         │                       │
  │                              ├───────────────────────────►│                       │
  │                              │                            │  JwtAuthGuard: @Public│
  │                              │                            │  ValidationPipe: DTO  │
  │                              │                            │  AuthController.login()│
  │                              │                            │  AuthService.login()  │
  │                              │                            │  StaticUserRepository │
  │                              │                            │  (or Drizzle → DB) ──►│
  │                              │                            │◄──────────────────────│
  │                              │                            │  bcrypt.compare()     │
  │                              │                            │  sessions.set(token)  │
  │                              │                            │  TransformInterceptor │
  │◄─────────────────────────────┤◄───────────────────────────│                       │
  │  { data: {user, token}, ...} │                            │                       │
  │                              │                            │                       │
  │  AuthProvider dispatch AUTH_SUCCESS                        │                       │
  │  sessionStorage + cookie set │                            │                       │
  │                              │                            │                       │
  │  window.location.href = '/'  │                            │                       │
  │                              │                            │                       │
  │  GET /  (full page reload)   │                            │                       │
  ├─────────────────────────────►│                            │                       │
  │                              │  getServerSession()        │                       │
  │                              │  GET /api/auth/me ────────►│                       │
  │                              │◄──────────────────────────┤                       │
  │                              │  WorkspacePage renders     │                       │
  │◄─────────────────────────────│                            │                       │
  │  HTML + RSC payload          │                            │                       │
```

---

## Step 1 — User Submits LoginForm

**File:** `apps/shell/src/components/login-form.tsx`

`LoginForm` is a client component (`'use client'`). It renders two controlled inputs (`email`, `password`) and a submit button. On submit, it calls `event.preventDefault()` to stop the native browser form submission, reads the field values from the form's `FormData`, and delegates to `useAuth().login()`.

```typescript
// apps/shell/src/components/login-form.tsx (simplified)
'use client';
import { useAuth } from '@mono/kernel/auth';

export function LoginForm() {
  const { login, isLoading } = useAuth();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await login({
      email: form.get('email') as string,
      password: form.get('password') as string,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>Sign in</button>
    </form>
  );
}
```

At this point, the data shape is a plain `LoginCredentials` object:

```typescript
// libs/kernel/auth/src/lib/auth.types.ts
export interface LoginCredentials {
  email: string;
  password: string;
}
```

---

## Step 2 — useAuth().login() Initiates the Fetch

**File:** `libs/kernel/auth/src/lib/auth.provider.tsx`

`useAuth()` reads from `AuthContext`. The `login` function in the context value is a `useCallback` defined inside `AuthProvider`. It:

1. Dispatches `AUTH_LOADING` to set `isLoading: true` in the reducer state.
2. Calls `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) })`.
3. Awaits the response and parses it as `ApiResponse<{ user: User; token: string }>`.
4. On success, dispatches `AUTH_SUCCESS` with the user and token.
5. On failure, dispatches `AUTH_FAILURE` and re-throws so the form can display an error.

```typescript
// libs/kernel/auth/src/lib/auth.provider.tsx (simplified)
const login = useCallback(async (credentials: LoginCredentials) => {
  dispatch({ type: 'AUTH_LOADING' });
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const envelope: ApiResponse<{ user: User; token: string }> = await res.json();
  if (!envelope.success) {
    dispatch({ type: 'AUTH_FAILURE' });
    throw new Error(envelope.message);
  }
  dispatch({ type: 'AUTH_SUCCESS', payload: envelope.data });
  // Step 12 continues here
}, []);
```

The fetch URL is `/api/auth/login` — a relative path. The browser sends this to `localhost:3000` (the Next.js dev server), which handles the routing in step 3.

---

## Step 3 — Next.js Rewrite Proxies to the Gateway

**File:** `apps/shell/next.config.ts`

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${API_URL}/api/:path*`,
    },
  ];
}
```

The Next.js dev server matches `/api/auth/login` against the `source` pattern and forwards the request — headers, body, and all — to `http://localhost:3001/api/auth/login`. The browser never directly opens a connection to port 3001.

**Why proxy instead of calling 3001 directly?**
- Avoids CORS. The browser's same-origin policy would require CORS preflight for cross-origin requests. Since the proxy makes the API appear same-origin with the shell, no preflight is needed for browser fetch calls.
- Simplifies the URL configuration. Client components only ever use relative paths like `/api/...`, making them environment-agnostic.

---

## Step 4 — JwtAuthGuard Skips Auth for @Public Routes

**File:** `apps/api-gateway/src/common/guards/jwt-auth.guard.ts`

`JwtAuthGuard` is registered globally in `AppModule` as:

```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

This means it runs before every controller method. The guard reads the `IS_PUBLIC_KEY` metadata from the handler and its class using `Reflector.getAllAndOverride`:

```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  ctx.getHandler(),
  ctx.getClass(),
]);
if (isPublic) return true; // skip token validation entirely
```

`AuthController.login()` is decorated with `@Public()`, so `isPublic` is `true` here. The guard returns `true` immediately, allowing the request to proceed to the next pipe in the pipeline.

---

## Step 5 — ValidationPipe Validates LoginDto

**File:** `apps/api-gateway/src/main.ts` and `apps/api-gateway/src/modules/auth/dto/login.dto.ts`

`ValidationPipe` is registered globally in `bootstrap()`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  transform: true,       // coerce plain JSON into class instances
  whitelist: true,       // strip properties not defined on the DTO
  forbidNonWhitelisted: true, // throw 400 if extra properties are present
}));
```

The `LoginDto` class defines the expected shape:

```typescript
// apps/api-gateway/src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@mono.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
```

`ValidationPipe` instantiates `LoginDto` from the request body, runs all `class-validator` decorators, and throws a `BadRequestException` (HTTP 400) with a detailed error array if any check fails. The `GlobalExceptionFilter` then formats this into the standard error envelope.

If validation passes, the request body is now a typed `LoginDto` instance — not a plain `any` object.

---

## Step 6 — AuthController Delegates to AuthService

**File:** `apps/api-gateway/src/modules/auth/auth.controller.ts`

```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto): Promise<SessionPayload> {
  return this.authService.login(dto.email, dto.password);
}
```

The controller is intentionally thin. It extracts the typed DTO from the body and passes the two values to `AuthService.login()`. No business logic lives here.

---

## Step 7 — StaticUserRepository Looks Up the User

**File:** `apps/api-gateway/src/modules/auth/repositories/static-user.repository.ts`

`AuthService.login()` calls `this.userRepo.findByEmail(email)`. The injected implementation is `StaticUserRepository` (the default when no database is configured):

```typescript
async findByEmail(email: string): Promise<UserRow | null> {
  return STATIC_USERS.find(u => u.email === email) ?? null;
}
```

`STATIC_USERS` is a hardcoded array of `UserRow` objects. Each has a `passwordHash` — a bcrypt hash pre-computed from the plaintext password.

If no user is found, `AuthService.login()` throws `UnauthorizedException('Invalid email or password')`. The same error message is used for both "user not found" and "wrong password" cases to prevent email enumeration.

When `DrizzleUserRepository` is bound instead (when `DATABASE_URL` is present), this step executes a `SELECT * FROM users WHERE email = $1 LIMIT 1` query via Drizzle ORM.

---

## Step 8 — bcrypt Verifies the Password

**File:** `apps/api-gateway/src/modules/auth/auth.service.ts`

```typescript
const valid = await bcrypt.compare(password, record.passwordHash);
if (!valid) throw new UnauthorizedException('Invalid email or password');
```

`bcrypt.compare()` is an async operation that hashes the candidate password with the same salt that was embedded in the stored hash and compares the result in constant time. Constant-time comparison prevents timing attacks that could reveal whether a user exists.

The library used is `bcryptjs` (pure JavaScript bcrypt) rather than `bcrypt` (native Node.js addon). `bcryptjs` is slower per hash but requires no native compilation, which simplifies cross-platform builds and Docker images.

---

## Step 9 — Token Issued, Session Stored in Memory

**File:** `apps/api-gateway/src/modules/auth/auth.service.ts`

```typescript
private issueToken(userId: string): string {
  const rand = Math.random().toString(36).slice(2, 11);
  return `sess_${userId}_${Date.now()}_${rand}`;
}
```

The token format is `sess_<userId>_<timestamp>_<random>`. This is an opaque session identifier — not a JWT. It has no embedded claims. The gateway validates it by looking it up in an in-memory `Map<string, User>`:

```typescript
private readonly sessions = new Map<string, User>();

// After bcrypt passes:
const token = this.issueToken(user.id);
this.sessions.set(token, user);
return { user, token };
```

**Why not JWT?** JWTs carry their claims in the token itself. They cannot be invalidated without an allowlist or short expiry. The in-memory session map can invalidate a session instantly by deleting the key (`logout()` calls `sessions.delete(token)`). For a horizontally scaled deployment, replace the `Map` with a Redis-backed `SessionRepository` without changing `AuthService` — only the injected implementation changes.

---

## Step 10 — TransformInterceptor Wraps the Response

**File:** `apps/api-gateway/src/common/interceptors/transform.interceptor.ts`

```typescript
intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
  return next.handle().pipe(
    map((data) => ({ data, success: true as const, message: 'OK' })),
  );
}
```

`TransformInterceptor` is also registered globally. It intercepts the return value of every controller method that does not throw, wraps it in the standard envelope, and returns the envelope. The HTTP status code is unchanged (200 for a successful login).

The `SessionPayload` returned by `AuthController.login()` becomes:

```json
{
  "data": {
    "user": {
      "id": "usr_01",
      "email": "admin@mono.dev",
      "name": "Admin User",
      "roles": ["admin", "user"],
      "permissions": ["read", "write", "admin"]
    },
    "token": "sess_usr_01_1746528000000_abc123xyz"
  },
  "success": true,
  "message": "OK"
}
```

---

## Step 11 — Browser Receives the ApiResponse Envelope

**File:** `libs/kernel/auth/src/lib/auth.provider.tsx`

The `fetch` call in `AuthProvider.login()` resolves. The response body is parsed as `ApiResponse<{ user: User; token: string }>`. The `success` field is checked:

- If `false`: dispatch `AUTH_FAILURE`, re-throw the error so the form can display it.
- If `true`: proceed to step 12.

The `User` type used here is from `@mono/shared/types` — the same type used by the NestJS service. TypeScript guarantees at compile time that the property names and types match.

---

## Step 12 — AuthProvider Sets sessionStorage and Cookie

**File:** `libs/kernel/auth/src/lib/auth.provider.tsx`

After dispatching `AUTH_SUCCESS` (which sets `isAuthenticated: true`, `user`, and `token` in the reducer):

```typescript
// Persist the token so it survives page refresh
sessionStorage.setItem('mono_token', envelope.data.token);

// Write a cookie so getServerSession() (RSC) can read it server-side.
// SameSite=Strict prevents CSRF. The cookie is not HttpOnly because
// the client reads it for the initial session restore on refresh.
document.cookie = `mono_session=${envelope.data.token}; path=/; SameSite=Strict`;
```

**Why both sessionStorage and a cookie?**
- `sessionStorage` is used by the client-side `AuthProvider` to restore the session on a soft navigation or hot-reload without calling the API.
- The cookie is used by `getServerSession()` in server components (RSC). Server components cannot read `sessionStorage` (it is a browser API). The `cookies()` helper from `next/headers` reads the `mono_session` cookie.

---

## Step 13 — Hard Navigation to the Workspace

**File:** `libs/kernel/auth/src/lib/auth.provider.tsx`

```typescript
window.location.href = '/';
```

A hard navigation is used instead of `router.push('/')`. Here is why:

`router.push` performs a client-side navigation. The root layout (`app/layout.tsx`) is a server component, but Next.js will only re-run it if the route segment changes. A client-side push to `/` from `/login` does navigate, but the server component's `getServerSession()` may not re-execute if Next.js serves it from the router cache.

`window.location.href` forces a full browser navigation — a real HTTP request to `/`. This guarantees that the server runs `getServerSession()` fresh, reads the cookie written in step 12, and renders the workspace with the authenticated user already in place. The result is that there is no loading flash.

---

## Step 14 — getServerSession Reads Cookie and Calls /api/auth/me

**File:** `libs/kernel/auth/src/server.ts`

```typescript
// libs/kernel/auth/src/server.ts
import { cookies } from 'next/headers';

export async function getServerSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('mono_session')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env['API_URL']}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', // Always fetch fresh session data
    });
    if (!res.ok) return null;
    const envelope: ApiResponse<User> = await res.json();
    return envelope.success ? envelope.data : null;
  } catch {
    return null;
  }
}
```

This function is called in three server components:
- `apps/shell/src/app/layout.tsx` — to hydrate `KernelProviders` with `initialUser`
- `apps/shell/src/app/(modules)/layout.tsx` — to guard the module layout (redirects to `/login` if null)
- `apps/shell/src/app/page.tsx` — to guard the workspace page

On the gateway side, `GET /api/auth/me` is handled by `AuthController.getMe()`. It is not decorated with `@Public()`, so `JwtAuthGuard` validates the Bearer token by calling `AuthService.validateToken(token)`, which is a `Map.get()` lookup. The `request.user` object (attached by the guard) is returned via `@CurrentUser()` decorator.

The response is an `ApiResponse<User>` envelope. `getServerSession()` unwraps the `data` field and returns the `User` object.

---

## Step 15 — WorkspacePage Renders

**File:** `apps/shell/src/app/page.tsx`

```typescript
export default async function WorkspacePage() {
  const user = await getServerSession();
  if (!user) redirect('/login'); // defensive — layout already checked

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkspaceTopbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <WorkspaceGreeting name={user.name} moduleCount={MODULES.length} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

The page renders server-side. `user.name` is available immediately without a client-side loading state. `MODULES` is the static module registry from `apps/shell/src/lib/modules.ts`. Each `ModuleCard` displays the module's icon, name, description, and links to its route.

The RSC payload (the serialised React tree) is streamed to the browser. React hydrates the client components (`WorkspaceTopbar` uses `useAuth()`, `KernelProviders` receives `initialUser` from the root layout). Because `initialUser` was passed as a prop, the `AuthProvider` initialises with `isAuthenticated: true` immediately — there is no post-hydration loading state.

---

## Error Path Reference

The table below summarises what happens at each step if an error occurs:

| Step | Error condition | Gateway response | Browser result |
|---|---|---|---|
| 5 | Invalid email format | `400 BadRequestException` | `{ success: false, message: "email must be an email", code: "VALIDATION_ERROR" }` |
| 5 | Password shorter than 6 chars | `400 BadRequestException` | Validation error with field-level messages |
| 7 | Email not found | `401 UnauthorizedException` | `{ success: false, message: "Invalid email or password" }` |
| 8 | Wrong password | `401 UnauthorizedException` | Same message as step 7 (prevents enumeration) |
| 14 | Token not in sessions Map | `401 UnauthorizedException` | `getServerSession()` returns `null` → redirect to `/login` |
| 14 | Gateway is down | `fetch` throws / `res.ok` is false | `getServerSession()` returns `null` → redirect to `/login` |

All error responses from the gateway follow the same envelope shape, enforced by the global `HttpExceptionFilter`:

```json
{
  "success": false,
  "data": null,
  "message": "Invalid email or password",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```
