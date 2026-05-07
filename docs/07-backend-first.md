# Backend-First Development

## Philosophy

We design the API contract **before** writing any UI code. The backend defines the shape of every resource, the error codes, and the auth model. The frontend is a consumer — it adapts to what the API says, not the other way around.

This eliminates a common failure mode: frontend and backend teams building in parallel and discovering a mismatch at integration time.

---

## The Workflow

```
1. Design the contract   →   2. Document it           →   3. Build backend
   (DTO + response shape)      (Swagger decorators)         (service + controller)

4. Review the Swagger UI →   5. Build frontend        →   6. Integration test
   with stakeholders           (against /api/docs)          (real API, no mocks)
```

### Step 1 — Design the contract

Before writing a service, answer:
- What is the **URL** and HTTP method?
- What goes in the **request body / query / params**?
- What does a **200 response** look like?
- What **errors** can it return and what HTTP status?
- Is it **public** or does it require a bearer token?

Write this down as a DTO class and a response DTO class — nothing else yet.

### Step 2 — Document with Swagger decorators

Add `@ApiOperation`, `@ApiOkResponse`, `@ApiBearerAuth` to the controller **before** the service method exists. Swagger will render the stub immediately so stakeholders can review the contract before a line of business logic is written.

### Step 3 — Build the backend

Implement the service method. The controller signature and DTO are already locked.

### Step 4 — Review the live Swagger UI

Open `http://localhost:3001/api/docs`. Use the **Authorize** button with credentials from `POST /api/auth/login`. Execute requests directly in the browser to validate real responses.

### Step 5 — Build the frontend

The frontend team uses `/api/docs` as the source of truth. They type the fetch calls against the DTO types exported from `@mono/shared/types` — not from ad-hoc guesses.

### Step 6 — Integration test

Tests hit the real API. No mocks of service logic, no mocks of HTTP. The Drizzle repository can point to a test database — but the HTTP layer is real.

---

## Response Envelope

Every API response is wrapped by the `TransformInterceptor`:

```typescript
// Success
{
  "success": true,
  "data": { /* your payload */ },
  "message": "OK"
}

// Error
{
  "success": false,
  "data": null,
  "message": "Invalid email or password",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

Frontend code unwraps `.data` — never access fields on the top-level response object directly.

```typescript
// ✅ correct
const session = await api.post<ApiResponse<SessionPayload>>('/api/auth/login', body);
const { user, token } = session.data.data;

// ❌ wrong — data is inside the envelope
const { user } = session.data;
```

---

## Authentication Model

All routes require a bearer token unless decorated with `@Public()`.

```
POST /api/auth/login      →  returns { user, token }
                                        ↓
                              store token in memory (AuthContext)
                                        ↓
GET  /api/auth/me         →  Authorization: Bearer <token>
POST /api/auth/refresh    →  rotates token (old token invalidated immediately)
POST /api/auth/logout     →  deletes session server-side
```

The token is an opaque random string stored in an in-memory `Map<token, User>` on the server. This is intentionally simple — swap the map for a Redis `SessionRepository` when you need horizontal scaling (see `docs/09-adding-an-endpoint.md`).

---

## Module Boundary Rule

The API gateway is the **only** service that talks to the database. Frontend libs (`@mono/kernel/*`, `@mono/modules/*`) talk exclusively to the gateway via HTTP. They never import Drizzle, never import NestJS, never reference `apps/api-gateway` directly.

```
Frontend libs  →  HTTP (rewrites proxy)  →  api-gateway  →  PostgreSQL
                  /api/*  →  :3001/api/*
```
