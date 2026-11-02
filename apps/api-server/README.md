# Innostes Business OS: API Server

The headless backend execution engine for the **Innostes Business Operating System (Business OS)**.

`apps/api-server` is a high-performance, asynchronous Python execution host built on **FastAPI** and **Uvicorn**. Engineered around strict decoupling, it allows organizations to run Innostes as a complete full-stack platform or consume it purely headlessly to power custom internal portals, mobile apps, and third-party integrations via standard **OpenAPI 3.1** contracts.

---

## 1. Architectural Role

`api-server` acts strictly as an execution engine:
- **No Direct Business Models**: The server does not define business entities or database tables directly. Core platform capabilities reside in the **Hardened Kernel** (`kernel/backend`), while business logic resides in independent **Business Modules** (`modules/*`) and **Plugins** (`plugins/*`).
- **Dynamic Module Discovery**: At startup, `api-server` queries Python entry points (`innostes.modules`) defined across workspace packages and dynamically registers their FastAPI routers, OpenAPI tags, and lifespan handlers.
- **Pure Headless Capability (Key USP)**: Any client that can speak HTTP/JSON can consume the Innostes engine. Every endpoint adheres to strict OpenAPI 3.1 specifications with complete request/response schemas, error response definitions, and deterministic status codes.

```
                           ┌────────────────────────────┐
                           │      apps/api-server       │
                           │   (FastAPI / ASGI Host)    │
                           └─────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼────────────────────────┐
                 ▼                       ▼                        ▼
        ┌─────────────────┐    ┌──────────────────┐     ┌──────────────────┐
        │  kernel/backend │    │    modules/*     │     │    plugins/*     │
        │ (Security/Auth) │    │  (SalesFlow/HR)  │     │    (Tracura)     │
        └─────────────────┘    └──────────────────┘     └──────────────────┘
```

---

## 2. Interactive API Documentation

Interactive and machine-readable documentation is generated automatically from the codebase:

| Endpoint | Interface | Purpose |
| :--- | :--- | :--- |
| `http://localhost:8001/docs` | **Swagger UI** | Explore and execute live endpoints interactively with authentication tokens |
| `http://localhost:8001/redoc` | **ReDoc** | Clean, searchable reference manual formatted for developers and integration teams |
| `http://localhost:8001/openapi.json` | **OpenAPI Spec** | Raw OpenAPI 3.1 JSON schema describing the complete platform contract |

### Exporting the Spec Offline

To generate or refresh `apps/api-server/openapi.json` without running a server instance:

```bash
pnpm nx run api-server:openapi
```

---

## 3. Environment Configuration

The API server reads environment variables from `.env` via `kernel.core.config.Settings`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8001` | HTTP listening port for ASGI server |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/erp_dev` | Async PostgreSQL connection string |
| `APP_ENV` | `development` | Deployment environment (`development`, `staging`, `production`) |
| `APP_NAME` | `Innostes Business OS API` | Application identifier in OpenAPI and logs |
| `APP_DEBUG` | `true` | Enables verbose stack traces and debug output |
| `JWT_SECRET_KEY` | *(insecure default)* | Secret key for JWT signature verification and session rotation |
| `CORS_ORIGINS` | `http://localhost:4200,http://localhost:3000` | Allowed origins for cross-origin requests |
| `AUTO_MIGRATE` | `true` | Automatically runs Alembic migrations on startup in dev containers |

---

## 4. Commands & Development

```bash
# Setup Python environment and install editable dependencies
pnpm nx run api-server:install

# Start API server in live reload mode (http://localhost:8001)
pnpm nx serve api-server

# Run backend unit tests
pnpm nx test api-server

# Export openapi.json specification
pnpm nx run api-server:openapi

# Automated quality gates: spec freshness and linting
pnpm nx run api-server:openapi-check
pnpm nx run api-server:openapi-lint
```

---

## 5. Automated Quality Gates

Every endpoint registered with `api-server` is validated in CI:
- **Spec Freshness**: `pnpm nx run api-server:openapi-check` regenerates the specification and verifies zero discrepancies against committed `openapi.json`.
- **Spectral & Rules Checklist**: Validates that all endpoints provide explicit summary, operation ID, error responses, parameters with descriptions, and Northwind example fixtures.
- **Architectural Fitness**: Imports are strictly linted via `.importlinter` to ensure the engine never imports modules directly.

---

## 6. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
