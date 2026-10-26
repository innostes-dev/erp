# Innostes ERP API Server

A pure execution engine hosting modular ERP services.

## Overview
`api-server` acts strictly as an execution host. It does not own database models or configuration logic directly; instead, it relies on the root `kernel` module for core platform capabilities and dynamically mounts registered ERP feature modules.

## Architecture
- **Engine**: Configures the FastAPI ASGI instance, lifespans, CORS, and observability.
- **Kernel Integration**: Leverages `kernel.core.config` for settings and `kernel.core.database` for connection pool teardown and health probes.
- **Module Runner**: Automatically loads and runs registered ERP modules.

## API documentation
Generated from the code (see "Documentation standards" in [kernel/README.md](../../kernel/README.md)):

| URL | What |
|---|---|
| `http://localhost:8001/docs` | Swagger UI: browse and try endpoints |
| `http://localhost:8001/redoc` | ReDoc: readable reference |
| `http://localhost:8001/openapi.json` | Raw OpenAPI spec |

To save the spec to a file without starting the server (e.g. for generating a frontend client):

```sh
pnpm nx run api-server:openapi   # writes apps/api-server/openapi.json
```

Modules add their own section to the docs through `openapi_tags` on their `BaseModule` class.

## Commands
```sh
pnpm nx run api-server:install   # Create .venv and install dependencies (including editable kernel)
pnpm nx serve api-server         # http://localhost:8001 (docs at /docs)
pnpm nx test api-server          # Run engine unit tests
pnpm nx run api-server:openapi   # Export OpenAPI spec to openapi.json
```
