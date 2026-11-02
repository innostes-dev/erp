# Innostes Business OS: Operational Business Suites

The `modules/` directory houses the domain-specific **Operational Business Suites** of the **Innostes Business Operating System (Business OS)**.

Innostes is built around an extensible, decoupled module system. Each business suite represents an independent functional area (such as CRM, HRMS, finance, or inventory) designed to operate without circular dependencies or vendor lock-in.

---

## 1. Ecosystem Matrix

| Module | Directory | Category | Current Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **SalesFlow** | `modules/salesflow` | Revenue & CRM | **Active** | Sales pipeline, deal stages, probability forecasting, contacts, and quotes. |
| **PeopleOps** | `modules/peopleops` | Workforce & HR | **Active** | Team directory, org charts, leave requests, attendance, and onboarding. |
| **LedgerFlow** | `modules/ledgerflow` | Financial Accounting | *Roadmap* | Double-entry bookkeeping, multi-currency invoicing, and reconciliations. |
| **StockFlow** | `modules/stockflow` | Inventory & Logistics | *Roadmap* | Multi-warehouse stock tracking, serial/lot tracking, and purchase orders. |
| **SprintFlow** | `modules/sprintflow` | Agile & Issues | *Roadmap* | Kanban boards, sprint cadences, bug tracking, and milestone releases. |
| **DocFlow** | `modules/docflow` | Living Company SOPs | *Roadmap* | Centralized knowledge base, handbooks, and standard operating procedures. |

---

## 2. Decoupled Module Architecture

Every Innostes business module follows a strict **dual-package structure**:

```
modules/<module_name>/
├── backend/                  # Python 3.12+ package
│   ├── <module_name>/        # Implementation (router, models, schemas, services)
│   │   ├── __init__.py       # Exports <Name>Module(BaseModule)
│   │   └── router.py         # FastAPI APIRouter
│   ├── tests/                # Unit and integration test suite
│   ├── pyproject.toml        # Declares [project.entry-points."innostes.modules"]
│   └── README.md             # Backend module documentation
│
├── frontend/                 # React 19 + TypeScript package
│   ├── src/
│   │   ├── manifest.ts       # ModuleManifest metadata loaded by web-app
│   │   ├── <Name>Page.tsx    # Primary workspace view
│   │   └── index.ts          # Package entry point
│   ├── package.json          # Declares package name (@innostes/<module_name>)
│   └── README.md             # Frontend module documentation
│
└── README.md                 # Module overview & architecture
```

---

## 3. Core Architectural Invariants

To keep the platform modular, maintainable, and open-source friendly, modules must adhere to strict rules:

1. **Kernel Dependency Only**: Modules may import from the hardened kernel (`kernel.core.*`, `kernel.tenancy`, `@innostes/kernel`), but **must never import from sibling modules** (e.g. SalesFlow cannot import PeopleOps).
2. **Engine Decoupling**: Modules never import from the execution hosts (`apps/api-server`, `apps/web-app`). The hosts discover modules dynamically.
3. **Pluggable Registration**:
   - Backend modules register via standard Python entry points in `pyproject.toml`.
   - Frontend modules register via typed `ModuleManifest` definitions loaded dynamically by the `apps/web-app` shell.

---

## 4. How to Build a New Module (Contributor Guide)

We welcome community-contributed modules! Here is how to create a new module (e.g. `ledgerflow`):

### Step 1: Scaffold Directory Structure
```bash
mkdir -p modules/ledgerflow/backend/ledgerflow modules/ledgerflow/frontend/src
```

### Step 2: Implement Backend Plug-in (`modules/ledgerflow/backend`)
Create `modules/ledgerflow/backend/ledgerflow/__init__.py`:
```python
from kernel.core.module import BaseModule
from ledgerflow.router import router

class LedgerFlowModule(BaseModule):
    name: str = "ledgerflow"
    version: str = "0.1.0"
    description: str = "LedgerFlow double-entry bookkeeping and financial accounting"
    router = router
    openapi_tags = [{"name": "LedgerFlow", "description": "Financial accounting endpoints."}]

module = LedgerFlowModule()
```

Register the entry point in `modules/ledgerflow/backend/pyproject.toml`:
```toml
[project.entry-points."innostes.modules"]
ledgerflow = "ledgerflow:module"
```

### Step 3: Implement Frontend Plug-in (`modules/ledgerflow/frontend`)
Create `modules/ledgerflow/frontend/src/manifest.ts`:
```typescript
export const ledgerflowManifest = {
  id: 'ledgerflow',
  name: 'LedgerFlow',
  version: '0.1.0',
  description: 'Double-entry bookkeeping, multi-currency invoicing, and reconciliations',
  type: 'module',
  href: '/ledgerflow',
  subFeatures: [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'accounts', label: 'Chart of Accounts' },
  ],
};
```

### Step 4: Install and Verify
```bash
# Re-install dependencies to link the new module entry points
pnpm nx run api-server:install

# Verify architecture contracts
pnpm run arch-check
```

---

## 5. License

All modules are open-source software licensed under the **[MIT License](../../LICENSE)**.
