# innostes ERP

A modern, modular enterprise ERP platform built with a decoupled two-engine architecture:
- **Backend Engine (`apps/api-server`)**: High-performance Python FastAPI engine dynamically discovering and mounting plug-ins via Python entry points.
- **UI Engine (`apps/web-app`)**: Accessible React 19 single-page app shell dynamically mounting module manifests and navigation.
- **Design System (`packages/ui` / `@innostes/ui`)**: Enterprise UI component library built on Base UI and Tailwind CSS v4.
- **Platform Kernel (`kernel/`)**: Foundational multi-tenancy, authentication, security primitives, and base abstractions.
- **Domain Business Modules (`modules/`)**: Self-contained business domains (`hrms`, `crm`).
- **Platform Plug-ins (`plugins/`)**: Extensible developer, telemetry, and logging plugins (`api-logger`).

---

## Quick Start

### 1. Prerequisites
- **Node.js**: >= 22.0.0
- **pnpm**: >= 10.0.0 (or v12)
- **Python**: >= 3.12 (for backend services)
- **PostgreSQL**: >= 16.0

### 2. Install Dependencies

```bash
pnpm install
pnpm nx run api-server:install
```

### 3. Run the Development Environment

```bash
# Start API server (:8001) and Web App (:4200) concurrently
pnpm dev

# Or start the documentation and marketing site (:3000)
pnpm nx dev landing
```

---

## Workspace Navigation & Applications

| Application / Package | Directory | Local URL / Purpose | Documentation |
| :--- | :--- | :--- | :--- |
| **Landing & Docs** | `apps/landing` | `http://localhost:3000` | [Documentation](/docs) |
| **Web App (UI Engine)** | `apps/web-app` | `http://localhost:4200` | [Web App Guide](/docs/apps/web-app) |
| **API Server (Backend Engine)** | `apps/api-server` | `http://localhost:8001` | [API Server Guide](/docs/apps/api-server) |
| **Kernel (Foundation)** | `kernel/` | Foundation services & gates | [Kernel Architecture](/docs/architecture/kernel) |
| **innostes UI** | `packages/ui` | Design system library | [UI Documentation](/ui/docs) |
| **API Reference** | `apps/landing` | Interactive OpenAPI docs | [API Reference](/api-reference) |

---

## Key Commands

```bash
# Quality gates and checks
pnpm run arch-check                      # Run all 6 architecture fitness gates
pnpm nx run-many -t lint test build      # Lint, test, and build all projects
pnpm nx run landing:docs-check           # Verify documentation links and frontmatter

# Database migrations
pnpm nx run kernel-backend:migrate       # Apply pending kernel migrations
```

---

## Architecture & Governance

Detailed architecture documentation is organized according to the **arc42** template:
- [Architecture Overview & Index](apps/landing/content/dev-docs/architecture/index.mdx)
- [C4 Building Blocks](apps/landing/content/dev-docs/architecture/building-blocks.mdx)
- [Plug-in Integration Contract](apps/landing/content/dev-docs/architecture/plugin-contract.mdx)
- [Architectural Decision Records (MADR 4.x)](apps/landing/content/dev-docs/architecture/decisions/index.mdx)
- [STRIDE Threat Model](apps/landing/content/dev-docs/architecture/threat-model.mdx)

## Licence

Commercial enterprise platform. All rights reserved.
