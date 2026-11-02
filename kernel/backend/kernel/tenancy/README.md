# Innostes Business OS: Tenancy Subsystem

The **Tenancy Subsystem** (`kernel/tenancy`) manages multi-tenant isolation, customer organization profiles, and localized workspace settings for the **Innostes Business Operating System (Business OS)**.

Every operational business record across all suites (SalesFlow, PeopleOps, etc.) is scoped to a specific tenant.

---

## 1. Subsystem Architecture

| File | Purpose |
| :--- | :--- |
| `models/tenant.py` | `Tenant` database model (`tenants` table). Inherits all common columns from `BaseModel`. |
| `schemas/tenant.py` | Pydantic validation schemas: `TenantCreate`, `TenantUpdate`, `TenantRead`. |
| `services/tenant_service.py` | `TenantService`: Inherits generic CRUD and soft-deletion logic from `BaseService`. |
| `router.py` | FastAPI HTTP endpoints mounted under `/tenants`. |
| `__init__.py` | Public exports and `TenancyModule(BaseModule)` registration. |

---

## 2. Database Schema: `tenants`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Globally unique tenant identifier |
| `name` | `varchar(255)` | Human-readable organization or company name (required) |
| `slug` | `varchar(63)` (unique) | URL-safe slug (letters, numbers, dashes). Preserved after soft-delete. |
| `country` | `varchar(2)` | ISO 3166-1 alpha-2 country code (e.g. `IN`, `US`, `GB`) |
| `timezone` | `varchar(64)` | IANA time zone identifier (e.g. `Asia/Kolkata`, `UTC`) |
| `language` | `varchar(16)` | BCP 47 language tag (e.g. `en-US`) |
| `date_format` | `varchar(20)` | Date formatting preference (e.g. `DD/MM/YYYY`) |
| *common audit columns* | `timestamptz` / `UUID` | `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` |

Migrations: `0001_create_tenants.py` and `0002_setup_and_tenant_profile.py` in `kernel/backend/migrations/versions/`.

---

## 3. REST API Endpoints

Interactive documentation is available at `http://localhost:8001/docs`:

| Method | Path | Summary | Success | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/tenants` | Create a new tenant organization | 201 | 409 (slug conflict), 422 |
| `GET` | `/tenants` | List tenant organizations (paginated, newest first) | 200 | 422 |
| `GET` | `/tenants/{tenant_id}` | Retrieve a tenant record by UUID | 200 | 404, 422 |
| `PATCH` | `/tenants/{tenant_id}` | Partially update tenant profile fields | 200 | 404, 409, 422 |
| `DELETE` | `/tenants/{tenant_id}` | Soft-delete tenant organization | 200 | 404, 422 |
| `POST` | `/tenants/{tenant_id}/restore` | Restore soft-deleted tenant | 200 | 404, 422 |

---

## 4. Programmatic Usage

```python
from kernel.tenancy import TenantCreate, TenantService

# Instantiate service within database session
service = TenantService(db_session)

# Create organization
tenant = await service.create(
    TenantCreate(
        name="Northwind Traders Pvt Ltd",
        slug="northwind-traders",
        country="IN",
        timezone="Asia/Kolkata"
    ),
    actor_id=current_user_id
)
```

---

## 5. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
