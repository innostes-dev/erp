<div align="center">

# Innostes

### The Extensible, Open-Source Business Operating System (Business OS)

Unify workforce, revenue, financials, inventory, and API telemetry on a single hardened enterprise core. Deploy the complete full-stack web application or consume the backend headlessly via strict OpenAPI 3.1 contracts.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Python: 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg?style=flat-square)](https://www.python.org/)
[![Node: 22+](https://img.shields.io/badge/node-22+-green.svg?style=flat-square)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square)](https://fastapi.tiangolo.com/)
[![React: 19](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square)](https://react.dev/)
[![Tailwind CSS: v4](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?style=flat-square)](https://tailwindcss.com/)
[![Architecture: Verified](https://img.shields.io/badge/Architecture-6%2F6%20Gates%20Passed-success.svg?style=flat-square)](#architecture--governance)

[Explore Documentation](https://innostes.com/docs) • [Interactive API Reference](https://innostes.com/api-reference) • [Design System (@innostes/ui)](https://innostes.com/ui/docs) • [Report Bug](https://github.com/innostes-dev/erp/issues)

</div>

---

## 1. What is Innostes?

Traditional enterprise resource planning (ERP) platforms are rigid, 30-year-old monolithic silos. In response, modern companies end up juggling ten disconnected SaaS subscriptions for CRM, HR, invoicing, task tracking, and observability—spending hundreds of engineering hours gluing them together with fragile webhooks and paying exponential per-seat fees.

**Innostes is not just an ERP; it is an Extensible Business Operating System.**

It delivers an integrated, modular runtime that brings business operations and developer infrastructure under a single, hardened enterprise kernel.

```mermaid
flowchart TD
    subgraph Innostes_Kernel ["Enterprise Kernel (Hardened Core)"]
        Auth["Auth & Session Rotation"]
        Tenancy["Tenant Isolation & Scopes"]
        RBAC["Role-Based Access Control"]
        Audit["Tamper-Evident Audit Trail"]
        Keys["Granular API Tokens"]
    end

    subgraph Business_Suites ["Operational Business Suites"]
        SalesFlow["SalesFlow (CRM & Pipeline)"]
        PeopleOps["PeopleOps (Workforce & HR)"]
        LedgerFlow["LedgerFlow (Finance & Invoicing)"]
        StockFlow["StockFlow (Inventory & Logistics)"]
        SprintFlow["SprintFlow (Agile & Issues)"]
        DocFlow["DocFlow (Living SOPs & Docs)"]
    end

    subgraph Infra_Plugins ["Developer & Observability Plugins"]
        Tracura["Tracura (Universal API Telemetry)"]
        Webhooks["Event Streams & Webhooks"]
        Integration["Custom Enterprise Extensions"]
    end

    subgraph Consumption_Layers ["Flexible Consumption Models (USP)"]
        Turnkey["Turnkey Web App (@innostes/ui + React 19)"]
        Headless["Headless Backend (REST / OpenAPI 3.1)"]
    end

    Innostes_Kernel --> Business_Suites
    Innostes_Kernel --> Infra_Plugins
    Business_Suites --> Consumption_Layers
    Infra_Plugins --> Consumption_Layers
```

### The Three Core Pillars

1. **A Unified Operating System**: Run customer pipelines, employee directories, financial accounting, inventory, and API telemetry from one single, cohesive codebase.
2. **True Decoupled Architecture (Key USP)**: Run the turnkey Next.js / React 19 web application (`apps/web-app`), or consume the FastAPI backend (`apps/api-server`) purely headlessly to power your own custom internal portals, mobile apps, or enterprise integrations via OpenAPI 3.1 specifications.
3. **100% Open-Source & Transparent**: Free to self-host forever under the MIT license. Unlimited users, unlimited seats, zero artificial paywalls, and complete PostgreSQL data sovereignty.

---

## 2. Platform Architecture & Ecosystem

Innostes is organized into clean, decoupled layers:

### Operational Business Suites (`modules/`)
- **[SalesFlow](modules/salesflow/README.md)**: Customer relationships, deal stages, probability forecasting, quote generation, and contact timelines.
- **[PeopleOps](modules/peopleops/README.md)**: Workforce directory, org charts, leave requests, approval hierarchies, and onboarding tracking.
- **LedgerFlow**: Double-entry bookkeeping, multi-currency invoicing, accounts payable/receivable, and financial reconciliations *(roadmap)*.
- **StockFlow**: Multi-warehouse stock tracking, serial/lot tracking, PO lifecycles, and low-inventory triggers *(roadmap)*.
- **SprintFlow**: Engineering issue tracking, sprint cadences, and milestone delivery *(roadmap)*.
- **DocFlow**: Centralized standard operating procedures (SOPs), knowledge bases, and team documentation *(roadmap)*.

### Developer & Telemetry Plugins (`plugins/`)
- **[Tracura](plugins/tracura/README.md)**: Universal API telemetry, distributed request tracing, sub-millisecond in-process ASGI logging, and remote polyglot ingestion with automatic PII & secret scrubbing.

### Hardened Enterprise Kernel (`kernel/`)
- **[Platform Kernel](kernel/README.md)**: Automatic multi-tenant database isolation, cryptographic audit logging for every mutation, scoped API tokens, session rotation, and foundational data access patterns.

### Enterprise Design System (`packages/ui`)
- **[@innostes/ui](packages/ui/README.md)**: High-performance, accessible enterprise UI component library built on Base UI and Tailwind CSS v4, supporting both light and dark OKLCH themes.

---

## 3. Quick Start

### Option A: Launch with Docker Compose (Recommended)

Get the complete Innostes Business OS up and running with PostgreSQL in under two minutes:

```bash
# Clone the repository
git clone https://github.com/innostes-dev/erp.git
cd erp

# Start all platform services
docker compose up -d
```

Access the services:
- **API Server & Health**: `http://localhost:8001`
- **Interactive Swagger Docs**: `http://localhost:8001/docs`
- **ReDoc Documentation**: `http://localhost:8001/redoc`

---

### Option B: Local Monorepo Development

#### Prerequisites
- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **Python**: `>= 3.12`
- **PostgreSQL**: `>= 16.0` (or running via `docker compose up -d db`)

#### 1. Install Monorepo Dependencies

```bash
# Install frontend workspace packages and Nx build tools
pnpm install

# Setup Python virtual environment and editable kernel/module packages
pnpm nx run api-server:install
```

#### 2. Configure Environment

```bash
# Copy template environment file
cp .env.example .env
```

Ensure your PostgreSQL credentials in `.env` match your local database:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_dev
PORT=8001
JWT_SECRET_KEY=insecure-dev-secret-key-change-in-production
```

#### 3. Run Database Migrations

```bash
pnpm nx run kernel-backend:migrate
```

#### 4. Launch Development Servers

```bash
# Run API server (port 8001) and Web App (port 4200) concurrently
pnpm dev

# Or run the documentation and marketing platform (port 3000)
pnpm nx dev landing
```

---

## 4. Monorepo Structure

```
innostes/
├── apps/
│   ├── api-server/         # Headless FastAPI backend execution engine (:8001)
│   ├── web-app/            # Turnkey React 19 UI engine and app shell (:4200)
│   └── landing/            # Public marketing & Fumadocs documentation site (:3000)
├── kernel/
│   ├── backend/            # Platform kernel: config, database, security, tenancy, audit
│   └── frontend/           # Kernel frontend: first-run setup gate & API client bindings
├── modules/
│   ├── peopleops/          # PeopleOps: workforce & HRMS suite (backend + frontend)
│   └── salesflow/          # SalesFlow: CRM & revenue pipeline suite (backend + frontend)
├── plugins/
│   └── tracura/            # Tracura: Universal API telemetry & observability engine
├── packages/
│   ├── ui/                 # @innostes/ui: Enterprise Base UI + Tailwind v4 component library
│   └── eslint-config/      # Shared workspace lint configurations
├── tests/                  # Cross-runtime compatibility test suites (React 17/18/19)
├── agent-prompts/          # Prompt specifications and verification checklists
├── docker-compose.yml      # Local container orchestration
└── CONTRIBUTING.md         # Open source contributor guide
```

---

## 5. Applications & Local URLs

| Application / Package | Directory | Local URL / Purpose | Documentation |
| :--- | :--- | :--- | :--- |
| **Landing & Docs** | `apps/landing` | `http://localhost:3000` | [Documentation Site](apps/landing/README.md) |
| **Web App (Turnkey UI)**| `apps/web-app` | `http://localhost:4200` | [Web App Guide](apps/web-app/README.md) |
| **API Server (Headless)**| `apps/api-server`| `http://localhost:8001` | [API Server Guide](apps/api-server/README.md) |
| **Swagger UI** | `apps/api-server`| `http://localhost:8001/docs` | Interactive Swagger API docs |
| **ReDoc UI** | `apps/api-server`| `http://localhost:8001/redoc` | Interactive ReDoc API manual |
| **Enterprise Kernel** | `kernel/` | Hardened platform foundation | [Kernel Architecture](kernel/README.md) |
| **Design System** | `packages/ui` | Accessible UI component library | [UI Documentation](packages/ui/README.md) |

---

## 6. Key Commands

```bash
# Architecture & Quality Verification
pnpm run arch-check                      # Enforce Python import contracts and TS boundaries
pnpm nx run-many -t lint test build      # Run linting, unit tests, and builds monorepo-wide
pnpm nx run landing:docs-check           # Enforce documentation quality gates and link resolution

# API Spec Operations
pnpm nx run api-server:openapi           # Export apps/api-server/openapi.json
pnpm nx run api-server:openapi-check     # Verify committed OpenAPI spec freshness

# Database Migrations
pnpm nx run kernel-backend:migrate       # Apply pending kernel database migrations
pnpm nx run kernel-backend:migration -- -m "message" # Generate a new Alembic migration
```

---

## 7. Comparison: Innostes vs Alternatives

| Operational Factor | Innostes Business OS | Fragmented SaaS Stack | Legacy Monolith (SAP, NetSuite) |
| :--- | :--- | :--- | :--- |
| **Licensing Model** | **100% Free to self-host (MIT)** | Exponential per-seat fees each month | Six-figure annual licensing contracts |
| **System Architecture**| **Decoupled: Turnkey UI or Headless API** | Siloed apps linked via fragile webhooks | Rigid proprietary stack with closed interfaces |
| **Data Ownership** | **100% Sovereignty (PostgreSQL)** | Stored across 10+ third-party cloud vendors | Stored in vendor cloud with complex data exit |
| **Developer Customization** | **FastAPI, Python, TypeScript, OpenAPI 3.1** | Limited to public rate-limited webhooks | Proprietary scripting languages (ABAP, SuiteScript) |
| **Telemetry & Observability** | **Native Tracura API engine included** | Requires separate expensive APM tools | High-overhead external diagnostic logs |

---

## 8. Commercial & Engineering Services

Innostes is 100% open-source and free to self-host forever. For organizations requiring specialized assistance, **Innostes Technologies** offers commercial support and bespoke engineering:

- **Assisted Deployment & Infrastructure Sizing**: Turnkey cloud deployment (AWS, GCP, Azure, Bare Metal), high-availability PostgreSQL clustering, automated backups, SSO/SAML integration, and data migration.
- **Bespoke Module Engineering**: Development of custom business modules, specialized workflows, and integrations with existing internal systems.
- **Enterprise SLA & Support**: Guaranteed response-time agreements, security patch deployment, and ongoing operational maintenance.

For inquiries, contact **sales@innostes.com** or visit our [Services Overview](https://innostes.com/services).

---

## 9. Security & Vulnerability Reporting

Security is central to the Innostes Business OS kernel. If you discover a vulnerability, please report it responsibly by emailing **security@innostes.com** rather than opening a public issue. See our [Security Policy](./SECURITY.md) for full response SLA details.

---

## 10. Contributing & License

We love community contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started with development, architectural invariants, and pull requests.

Innostes Business OS is open-source software licensed under the **[MIT License](./LICENSE)**.
