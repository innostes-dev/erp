# Innostes Business OS: Platform Kernel (Backend)

The **Platform Kernel Backend** (`kernel/backend`) is the core Python foundation of the **Innostes Business Operating System (Business OS)**. It is packaged as the installable Python library `kernel` and dynamically consumed by `apps/api-server`.

The kernel provides:
- **`core/`**: Pure infrastructure and platform primitives without business domain logic (config, database engine, security, module discovery system, base schemas, and generic services).
- **Platform Features** (such as **`tenancy/`** and **`setup/`**): Core schemas and APIs that every operational business module relies upon.

Business modules (such as SalesFlow and PeopleOps) live outside the kernel in `modules/` and depend on the kernel. The kernel never imports them.

---

## 1. Directory Layout

```
kernel/backend/
├── kernel/              # The importable Python package (import kernel...)
│   ├── core/
│   │   ├── config/      # Settings loaded from environment & .env files
│   │   ├── database/    # Async engine, sessionmaker (get_db), BaseModel, mixins
│   │   ├── module/      # BaseModule contract + ModuleRegistry
│   │   ├── schemas/     # BaseSchema, AuditReadSchema, Page, ErrorResponse
│   │   ├── security/    # JWT helpers, token validation, get_actor_id
│   │   └── services/    # BaseService: generic CRUD + soft-delete + audit columns
│   ├── tenancy/         # Tenant models, services, and APIs (see tenancy/README.md)
│   ├── setup/           # First-run setup: installation flag and /setup endpoints
│   └── models.py        # Central model registry for Alembic migration discovery
├── migrations/          # Alembic migrations for kernel tables
├── tests/               # Architecture fitness and kernel unit tests
├── alembic.ini          # Migration configuration
└── pyproject.toml       # Package metadata + "innostes.modules" entry points
```

---

## 2. Standardized Database Columns

Every enterprise table inherits `kernel.core.database.BaseModel` and receives these columns automatically:

| Column | Type | Meaning |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Unique record ID (generated via Python `uuid.uuid4`) |
| *domain columns* | ... | Specific table columns (e.g. `name`, `status`, etc.) |
| `created_at` | `timestamptz` | Automatically set by the database on insert |
| `created_by` | `UUID` (null) | Actor ID who created the record |
| `updated_at` | `timestamptz` | Automatically updated on every mutation |
| `updated_by` | `UUID` (null) | Actor ID who last modified the record |
| `deleted_at` | `timestamptz` (null, indexed) | Soft-delete timestamp; null while active |
| `deleted_by` | `UUID` (null) | Actor ID who deleted the record |

The individual mixins (`UUIDPrimaryKeyMixin`, `TimestampMixin`, `AuditMixin`, `SoftDeleteMixin`) are also exported for specialized tables.

`BaseService` populates the `*_by` columns from the authenticated actor and filters out soft-deleted rows unless `include_deleted=True`. `AuditReadSchema` exposes these fields in API responses.

---

## 3. Creating a Platform Feature

To add a new platform feature (e.g. `access`):

1. Create a directory following the standard kernel pattern:
   ```
   kernel/<feature>/
   ├── __init__.py       # Public exports + <Feature>Module(BaseModule)
   ├── models/           # class Role(BaseModel): feature-specific columns
   ├── schemas/          # RoleCreate(BaseSchema), RoleUpdate(BaseSchema), RoleRead(AuditReadSchema)
   ├── services/         # class RoleService(BaseService[Role]): model = Role
   └── router.py         # FastAPI APIRouter with documented endpoints
   ```
2. Import its models in `kernel/models.py`.
3. Generate a database migration:
   ```bash
   pnpm nx run kernel-backend:migration -- -m "create roles"
   ```
4. Register the module in `pyproject.toml` under `[project.entry-points."innostes.modules"]`:
   ```toml
   access = "kernel.access:module"
   ```
5. Install and verify: `pnpm nx run api-server:install`. The API server loads it automatically.
6. Add unit tests in `tests/`.

> **Dependency Rule:** Features may import from `core` and from features positioned below them in the hierarchy (`tenancy` ← `identity` ← `access`). Import other features only through their top-level package (`from kernel.tenancy import Tenant`), never their internals.

---

## 4. Documentation Standards for Endpoints

All endpoints are documented directly in Python code for automatic OpenAPI 3.1 generation:

- **Route Decorator**:
  - `summary=`: Imperative sentence case, $\le 60$ characters, no trailing period (e.g. `"Create a tenant"`).
  - `operation_id="<feature>_<action>"`: Stable snake_case identifier (e.g. `"tenants_create"`).
  - `response_description=`: Explicit description of what is returned on success.
  - `openapi_extra={"security": [...]}`: Declares required security schemes (e.g. `[{"BearerAuth": []}]` or `[]`).
  - `responses=error_responses(...)`: Explicit list of handled error models.
- **Endpoint Docstrings**: Text before `\f` is public API documentation; text after `\f` is internal developer guidance.
- **Schemas**:
  - `model_config = {"json_schema_extra": {"examples": [...]}}` provides realistic Northwind fixture examples.
  - Suffixes follow standard naming: `<Entity>Create`, `<Entity>Update`, `<Entity>Read`.

---

## 5. Automated Quality Gates

CI enforces strict quality checks on the kernel:

- **Spec Freshness**: `pnpm nx run api-server:openapi-check` ensures generated OpenAPI matches committed specifications.
- **Spectral & Rules Checklist**: Python script `scripts/lint_openapi.py` validates rule conformance.
- **Import Contracts**: `apps/api-server/.venv/bin/lint-imports --config=.importlinter` ensures no architectural leaks.

---

## 6. Development Commands

```bash
# Run kernel unit tests
pnpm nx test kernel-backend

# Apply pending Alembic migrations
pnpm nx run kernel-backend:migrate

# Generate a new migration
pnpm nx run kernel-backend:migration -- -m "add feature table"
```

---

## 7. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
