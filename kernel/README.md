# Innostes Business OS: Platform Kernel

The **Platform Kernel** is the hardened, immutable security and infrastructure foundation of the **Innostes Business Operating System (Business OS)**.

All business suites (`modules/*`) and developer tools (`plugins/*`) execute on top of the kernel. The kernel enforces security boundaries, multi-tenant isolation, cryptographic audit logging, database persistence contracts, and session rotation.

```
                          ┌────────────────────────────┐
                          │   Business Suites & APM    │
                          │(SalesFlow, PeopleOps, ...) │
                          └─────────────┬──────────────┘
                                        │ (Depends on)
                                        ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                       HARDENED PLATFORM KERNEL                        │
    │  ┌───────────────────────┐ ┌───────────────────┐ ┌─────────────────┐  │
    │  │ Multi-Tenancy Engine  │ │  Cryptographic    │ │ Scoped Access   │  │
    │  │ (Tenant Scopes & Hdr) │ │  Audit Trail      │ │ Tokens & RBAC   │  │
    │  └───────────────────────┘ └───────────────────┘ └─────────────────┘  │
    │  ┌───────────────────────┐ ┌───────────────────┐ ┌─────────────────┐  │
    │  │ Base Database Models  │ │ Module Registry   │ │ Setup Gate      │  │
    │  │ (Soft Delete & Audit) │ │ & Lifespans       │ │ & Token Wizard  │  │
    │  └───────────────────────┘ └───────────────────┘ └─────────────────┘  │
    └───────────────────────────────────────────────────────────────────────┘
```

---

## 1. Monorepo Organization

The kernel is structured into two clean workspace packages:

| Directory | Package | Language | Purpose |
| :--- | :--- | :--- | :--- |
| **`kernel/backend/`** | `kernel` | Python 3.12+ | Core database abstractions, Alembic migrations, tenant context, audit logger, and module interfaces. |
| **`kernel/frontend/`** | `@innostes/kernel` | TypeScript / React 19 | Setup gateway (`<SetupGate>`), initial admin setup wizard, and API client utilities. |

---

## 2. Kernel Core Primitives

### Multi-Tenancy & Data Isolation
- Strict logical multi-tenancy enforced at the persistence layer.
- Automatic tenant resolution from request headers (`X-Tenant-ID`) or authenticated user session claims.
- Cross-tenant data leakage is prevented via base query filters in `BaseService`.

### Tamper-Evident Audit Trail
- Every write mutation (insert, update, soft-delete) records an immutable, timestamped audit record.
- Captures actor ID, IP address, tenant ID, and state deltas (`before` / `after`).
- Directly linked with [Tracura](../plugins/tracura/README.md) HTTP request telemetry via `X-Correlation-ID`.

### Base Persistence Columns
Every enterprise table inheriting `kernel.core.database.BaseModel` automatically includes standardized columns:

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Globally unique identifier (v4 or v7) |
| `created_at` | `timestamptz` | Automated timestamp set on insertion |
| `created_by` | `UUID` (nullable) | Authenticated actor ID who created the record |
| `updated_at` | `timestamptz` | Automated timestamp refreshed on every update |
| `updated_by` | `UUID` (nullable) | Authenticated actor ID who last modified the record |
| `deleted_at` | `timestamptz` (indexed) | Soft-delete timestamp (`NULL` if active) |
| `deleted_by` | `UUID` (nullable) | Authenticated actor ID who deleted the record |

### Scoped API Tokens & Security
- Cryptographic JWT authentication with session rotation.
- Fine-grained API tokens restricted to explicit module permissions (e.g. `salesflow:read`, `peopleops:write`, `tracura:ingest`).
- Automatic PII and credential scrubbing across request logs.

---

## 3. Architectural Invariants

To maintain enterprise security and long-term modular stability, the kernel enforces strict architectural rules verified by CI quality gates (`pnpm run arch-check`):

1. **Kernel Zero External Dependencies**: The kernel never imports business modules (`modules/*`), developer plugins (`plugins/*`), or application engines (`apps/*`).
2. **Layered Feature Order**: Features within `kernel/backend` follow a strict inward dependency order:
   ```
   core ◄── setup ◄── tenancy ◄── identity ◄── access
   ```
3. **Contract Inheritance**: All business modules must inherit from `kernel.core.module.BaseModule` and use `kernel.core.database.BaseModel`.

---

## 4. Documentation Guides

- [Backend Kernel Deep Dive](backend/README.md): Layout, Alembic migrations, database sessions, and authoring new platform features.
- [Frontend Kernel Deep Dive](frontend/README.md): Setup gate, setup token wizard, and API client configuration.
- [Tenancy Subsystem](backend/kernel/tenancy/README.md): Tenant organization structure, schema, and API routes.

---

## 5. License

Open-source software licensed under the **[MIT License](../LICENSE)**.
