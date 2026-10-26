# Innostes ERP Kernel

The **kernel** is the shared foundation of Innostes ERP. It holds:

- **`core/`**: infrastructure with no business tables (config, database, security, module system, shared schemas and services).
- **Platform features** such as **`tenancy/`**: tables and APIs that every ERP module relies on.

ERP business modules (sales, inventory, HR, ...) live outside the kernel and depend on it. The kernel never imports them.

## Layout

This folder (`kernel/backend`) is the kernel's backend plug-in, an installable Python package named `kernel`. The frontend part will live in `kernel/frontend`.

```
kernel/backend/
├── kernel/              # the Python package (import kernel...)
│   ├── core/
│   │   ├── config/      # Settings loaded from .env files + environment
│   │   ├── database/    # Engine, session (get_db), Base, BaseModel, column mixins, migrations runner
│   │   ├── module/      # BaseModule contract + ModuleRegistry
│   │   ├── schemas/     # BaseSchema, AuditReadSchema, Page, ErrorResponse
│   │   ├── security/    # JWT helpers, get_actor_id dependency
│   │   └── services/    # BaseService: generic CRUD + soft delete + audit columns
│   ├── tenancy/         # Tenants feature (see tenancy/README.md)
│   ├── setup/           # First-run setup: installation table, /setup endpoints
│   └── models.py        # Imports every kernel table so Alembic sees it
├── migrations/          # Alembic migrations for kernel tables
├── tests/
├── alembic.ini
└── pyproject.toml       # package metadata + "innostes.modules" entry points
```

## Common columns

Every table inherits `kernel.core.database.BaseModel` and gets these columns automatically, in this order:

| Column | Type | Meaning |
|---|---|---|
| `id` | UUID, PK | Unique id (generated in Python) |
| *own columns* | | e.g. `name` |
| `created_at` | timestamptz | Set by the database on insert |
| `created_by` | UUID, null | User who created the row |
| `updated_at` | timestamptz | Set by the database on every update |
| `updated_by` | UUID, null | User who last changed the row |
| `deleted_at` | timestamptz, null, indexed | Soft-delete time; null while active |
| `deleted_by` | UUID, null | User who deleted the row |

The individual mixins (`UUIDPrimaryKeyMixin`, `TimestampMixin`, `AuditMixin`, `SoftDeleteMixin`) are also exported for special tables that need only some of them.

`BaseService` fills the `*_by` columns from the acting user and hides soft-deleted rows unless `include_deleted=True`. `AuditReadSchema` exposes the same fields in API responses.

## Adding a feature (e.g. roles)

1. Create the folder with the same layout as `tenancy/`:
   ```
   kernel/<feature>/
   ├── __init__.py   # public exports + <Feature>Module(BaseModule) with openapi_tags
   ├── models/       # class Role(BaseModel): only the feature's own columns
   ├── schemas/      # RoleCreate(BaseSchema), RoleUpdate(BaseSchema), RoleRead(AuditReadSchema)
   ├── services/     # class RoleService(BaseService[Role]): model = Role
   └── router.py     # APIRouter with documented endpoints
   ```
2. Import its models in `kernel/models.py`.
3. Create a migration: `pnpm nx run kernel-backend:migration -- -m "create roles"`, then review the generated file.
4. Register it in `pyproject.toml` under `[project.entry-points."innostes.modules"]` (e.g. `access = "kernel.access:module"`) and run `pnpm nx run api-server:install`. The API server loads it automatically.
5. Add tests in `tests/`.

Full guide: developer docs → Guides → Building a Feature (`apps/landing/content/dev-docs/guides/building-a-feature.mdx`).

**Dependency rule:** features may import from `core` and from features below them (`tenancy` ← `identity` ← `access`), never the reverse. Import other features only through their package (`from kernel.tenancy import Tenant`), not their internals.

## Documentation standards

**Code**: Google-style docstrings on every module, public class and public function:

```python
def get(self, id: uuid.UUID, include_deleted: bool = False) -> ModelT | None:
    """Fetch one record by id.

    Args:
        id: Record id.
        include_deleted: If True, a soft-deleted record can be returned.

    Returns:
        The record, or None if not found.
    """
```

**API**: the docs at `/docs` are generated from the code, so document endpoints where they are defined:

- Route decorator: `summary=`, `response_description=`, `operation_id="<feature>_<action>"`, and `responses=error_responses(<error classes>)` listing the service errors the endpoint can raise. Never write status codes as numbers: each error class (one per HTTP 4xx/5xx status, e.g. `NotFoundError`, `ConflictError`, `ServiceUnavailableError` in `core/services/errors.py`) declares its `fastapi.status` constant, and `core/http.py` maps raised errors to responses.
- Endpoint docstring: text **before `\f`** is the public API description. Text **after `\f`** (Args/Returns/Raises) is for developers and is hidden from the API docs.
- Schemas: `Field(description=..., examples=[...])` on every field, plus a full example in `model_config["json_schema_extra"]` for read schemas.
- Module: describe each router tag in `openapi_tags` on the module class.

## Usage

```python
from kernel.core.config import get_settings
from kernel.core.database import BaseModel, get_db
from kernel.core.schemas import AuditReadSchema, BaseSchema, Page, error_responses
from kernel.core.security import create_access_token, decode_token, get_actor_id
from kernel.core.services import BaseService
from kernel.tenancy import Tenant, TenantService
```

## Commands

```sh
pnpm nx test kernel-backend          # unit tests
pnpm nx run kernel-backend:migrate    # apply migrations (alembic upgrade head)
pnpm nx run kernel-backend:migration -- -m "message"   # generate a migration
```
