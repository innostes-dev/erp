# Tenancy

Tenants are the customer organisations using the ERP. Every business record will belong to a tenant.

## Files

| Path | Contents |
|---|---|
| `models/tenant.py` | `Tenant` table (`tenants`). Only `name` is tenant-specific; common columns come from `BaseModel`. |
| `schemas/tenant.py` | `TenantCreate`, `TenantUpdate`, `TenantRead` |
| `services/tenant_service.py` | `TenantService`: CRUD inherited from `BaseService`; put tenant rules here |
| `router.py` | HTTP endpoints under `/tenants` |
| `__init__.py` | Public exports and `TenancyModule` (registered by the API server) |

## Table: `tenants`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | varchar(255) | Required |
| `slug` | varchar(63), unique | Required. Lowercase letters, digits and dashes. Stays reserved after soft delete. |
| `country` | varchar(2) | ISO country code |
| `timezone` | varchar(64) | IANA time zone |
| `language` | varchar(16) | BCP 47 tag |
| `date_format` | varchar(20) | e.g. `DD/MM/YYYY` |
| `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` | | Common columns, see [kernel README](../README.md#common-columns) |

Migrations: `0001_create_tenants.py`, `0002_setup_and_tenant_profile.py` (profile columns) in `kernel/backend/migrations/versions/`.

## API

Full interactive docs: run the API server and open `http://localhost:8001/docs` (or `/redoc`).

| Method | Path | Description | Success | Errors |
|---|---|---|---|---|
| `POST` | `/tenants` | Create a tenant | 201 | 409 (slug taken), 422 |
| `GET` | `/tenants?offset=&limit=&include_deleted=` | List tenants, newest first | 200 | 422 |
| `GET` | `/tenants/{tenant_id}` | Get one tenant | 200 | 404, 422 |
| `PATCH` | `/tenants/{tenant_id}` | Update fields that are sent | 200 | 404, 409, 422 |
| `DELETE` | `/tenants/{tenant_id}` | Soft delete | 200 | 404, 422 |
| `POST` | `/tenants/{tenant_id}/restore` | Undo soft delete | 200 | 404, 422 |

Example:

```http
POST /tenants
Authorization: Bearer <access token>
Content-Type: application/json

{ "name": "Acme Corporation", "slug": "acme", "country": "IN" }
```

```json
{
  "id": "3f6c1a52-8d5e-4b8e-9c1a-2f6d3e7b9a10",
  "name": "Acme Corporation",
  "slug": "acme",
  "country": "IN",
  "timezone": null,
  "language": null,
  "date_format": null,
  "created_at": "2026-10-26T10:15:00Z",
  "created_by": "9b2e4c71-0a3d-4f5e-8b6c-1d2e3f4a5b6c",
  "updated_at": "2026-10-26T10:15:00Z",
  "updated_by": "9b2e4c71-0a3d-4f5e-8b6c-1d2e3f4a5b6c",
  "deleted_at": null,
  "deleted_by": null
}
```

The bearer token is optional for now. When present, its user id (`sub`) is stored in `created_by` / `updated_by` / `deleted_by`. These endpoints are **not access-controlled yet**.

## Usage from code

```python
from kernel.tenancy import TenantCreate, TenantService

service = TenantService(session)
tenant = await service.create(TenantCreate(name="Acme", slug="acme"), actor_id=user_id)
```
