# Innostes ERP API Server

A pure execution engine hosting modular ERP services.

## Overview
`api-server` acts strictly as an execution host. It does not own database models or configuration logic directly; instead, it relies on the root `kernel` module for core platform capabilities and dynamically mounts registered ERP feature modules.

## Architecture
- **Engine**: Configures the FastAPI ASGI instance, lifespans, CORS, and observability.
- **Kernel Integration**: Leverages `kernel.config` for settings and `kernel.database` for connection pool teardown and health probes.
- **Module Runner**: Automatically loads and runs registered ERP modules.

## Commands
```sh
pnpm nx run api-server:install   # Create .venv and install dependencies (including editable kernel)
pnpm nx serve api-server         # http://localhost:8001 (docs at /docs)
pnpm nx test api-server          # Run engine unit tests
```
