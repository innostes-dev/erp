# Innostes SalesFlow (Backend)

The backend service package (`innostes_salesflow`) for the **SalesFlow CRM & Revenue Pipeline Suite** in the Innostes Business Operating System.

---

## 1. Overview

`innostes_salesflow` is a pluggable Python module that dynamically mounts into `apps/api-server` via Python entry points. It inherits all core platform capabilities (multi-tenancy, cryptographic audit logging, soft deletion, and authentication) from the hardened `kernel`.

---

## 2. Directory Layout

```
modules/salesflow/backend/
├── salesflow/
│   ├── __init__.py       # SalesFlowModule(BaseModule) definition & exports
│   └── router.py         # FastAPI APIRouter and Pydantic schemas
├── tests/
│   └── test_salesflow.py # Unit tests
├── pyproject.toml        # Package metadata + innostes.modules entry point
└── README.md
```

---

## 3. Entry Point Registration

In `pyproject.toml`, the module registers under the `innostes.modules` entry point group:

```toml
[project.entry-points."innostes.modules"]
salesflow = "salesflow:module"
```

When `api-server` boots, it discovers `salesflow:module` and mounts its router under the `/salesflow` prefix.

---

## 4. Endpoints

| Method | Path | Summary | Success | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/salesflow/info` | Get SalesFlow module metadata and scaffold status | 200 OK | Public |

### Response Schema (`SalesFlowInfoResponse`)

```json
{
  "id": "salesflow",
  "name": "SalesFlow",
  "version": "0.1.0",
  "status": "scaffold_ready",
  "sub_features": [
    "leads",
    "deals",
    "pipeline",
    "contacts"
  ],
  "description": "SalesFlow sales pipeline, customer leads, deals, and accounts"
}
```

---

## 5. Development & Testing

```bash
# Run SalesFlow unit tests
apps/api-server/.venv/bin/python -m unittest discover -s modules/salesflow/backend/tests

# Or run via Nx test runner
pnpm nx test salesflow-backend
```

---

## 6. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
