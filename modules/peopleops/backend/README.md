# Innostes PeopleOps (Backend)

The backend service package (`innostes_peopleops`) for the **PeopleOps Workforce & HRMS Suite** in the Innostes Business Operating System.

---

## 1. Overview

`innostes_peopleops` is a pluggable Python module that registers dynamically with `apps/api-server` via Python entry points. It inherits all core platform capabilities (multi-tenancy, cryptographic audit logging, soft deletion, and authentication) from the hardened `kernel`.

---

## 2. Directory Layout

```
modules/peopleops/backend/
├── peopleops/
│   ├── __init__.py       # PeopleOpsModule(BaseModule) definition & exports
│   └── router.py         # FastAPI APIRouter and Pydantic schemas
├── tests/
│   └── test_peopleops.py # Unit tests
├── pyproject.toml        # Package metadata + innostes.modules entry point
└── README.md
```

---

## 3. Entry Point Registration

In `pyproject.toml`, the module registers under the `innostes.modules` entry point group:

```toml
[project.entry-points."innostes.modules"]
peopleops = "peopleops:module"
```

When `api-server` boots, it discovers `peopleops:module` and mounts its router under the `/peopleops` prefix.

---

## 4. Endpoints

| Method | Path | Summary | Success | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/info` | Get PeopleOps module metadata and scaffold status | 200 OK | Public |

### Response Schema (`PeopleOpsInfoResponse`)

```json
{
  "id": "peopleops",
  "name": "PeopleOps",
  "version": "0.1.0",
  "status": "scaffold_ready",
  "sub_features": [
    "employees",
    "leave",
    "payroll",
    "attendance"
  ],
  "description": "People operations, employee directory, leaves, and payroll"
}
```

---

## 5. Development & Testing

```bash
# Run PeopleOps unit tests
apps/api-server/.venv/bin/python -m unittest discover -s modules/peopleops/backend/tests

# Or run via Nx test runner
pnpm nx test peopleops-backend
```

---

## 6. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
