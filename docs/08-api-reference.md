# API Reference

> **Live docs**: `http://localhost:3001/api/docs` (Swagger UI, dev only)
>
> All endpoints are prefixed with `/api`. All responses use the envelope format — see `07-backend-first.md`.

---

## Base URL

| Environment | URL |
|---|---|
| Local dev | `http://localhost:3001/api` |
| Via shell proxy | `http://localhost:3000/api` |

The Next.js shell rewrites `/api/*` → `http://localhost:3001/api/*`, so browser code can call `/api/auth/login` without CORS issues.

---

## Authentication

Protected routes require:
```
Authorization: Bearer <token>
```

Obtain a token from `POST /api/auth/login`. Tokens are opaque strings — treat them as secrets, never log them.

---

## Endpoints

### Health

#### `GET /api/health`
**Public** — No auth required.

Returns server uptime and version. Use this for load-balancer probes.

**Response 200**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 1234.56,
    "timestamp": "2026-05-06T12:00:00.000Z",
    "version": "0.0.0"
  },
  "message": "OK"
}
```

---

### Auth

#### `POST /api/auth/login`
**Public** — No auth required.

Authenticate with email and password. Returns a session token.

**Request body**
```json
{
  "email": "admin@mono.dev",
  "password": "admin123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✓ | Must be a valid email |
| `password` | string | ✓ | Min 6 characters |

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01",
      "email": "admin@mono.dev",
      "name": "Admin User",
      "roles": ["admin", "user"],
      "permissions": ["read", "write", "admin"]
    },
    "token": "tok_abc123xyz"
  },
  "message": "OK"
}
```

**Error 401**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid email or password",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

**Seed credentials**
| Email | Password | Roles |
|---|---|---|
| `admin@mono.dev` | `admin123` | admin, user |
| `user@mono.dev` | `user123` | user |

---

#### `GET /api/auth/me`
**Protected** — Requires bearer token.

Returns the user profile attached to the current session.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "usr_01",
    "email": "admin@mono.dev",
    "name": "Admin User",
    "roles": ["admin", "user"],
    "permissions": ["read", "write", "admin"]
  },
  "message": "OK"
}
```

**Error 401** — Token missing or not found in session store.

---

#### `POST /api/auth/refresh`
**Protected** — Requires bearer token.

Rotates the session token. The old token is **immediately invalidated** — the new token must be used for all subsequent requests.

Call this before the session expires or when a security rotation is needed.

**Response 200** — Same shape as login: `{ user, token }` with a new token value.

**Error 401** — Session not found (token already expired or logged out).

---

#### `POST /api/auth/logout`
**Protected** — Requires bearer token.

Terminates the session. The token is removed from the server's session store.

**Response 200**
```json
{
  "success": true,
  "data": { "ok": true },
  "message": "OK"
}
```

---

## Error Codes

| HTTP Status | `code` | Meaning |
|---|---|---|
| 400 | `BADREQUEST` | Validation failure — check `message` for field details |
| 401 | `UNAUTHORIZED` | Missing token, invalid token, or bad credentials |
| 403 | `FORBIDDEN` | Token valid but user lacks required role/permission |
| 404 | `NOTFOUND` | Resource does not exist |
| 500 | `INTERNAL_ERROR` | Unhandled server error — check gateway logs |

---

## TypeScript Types

Shared types are exported from `@mono/shared/types`. Import them in any lib:

```typescript
import type { User, LoginCredentials } from '@mono/shared/types';
```

| Type | Fields |
|---|---|
| `User` | `id`, `email`, `name`, `roles[]`, `permissions[]` |
| `LoginCredentials` | `email`, `password` |

The `SessionPayload` type (`{ user: User; token: string }`) lives in `apps/api-gateway/src/modules/auth/auth.service.ts` — it is internal to the gateway. The frontend only needs `User`.
