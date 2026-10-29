# API Documentation Terminology & Editorial Sheet

This document defines the canonical terminology, vocabulary distinctions, and prose standards for the Innostes ERP API reference, guides, and OpenAPI schemas. All writers and reviewers must adhere to these conventions.

---

## 1. Domain Terminology & Distinctions

| Term | Preferred Usage | Avoid | Explanation |
| :--- | :--- | :--- | :--- |
| **Access Token** | `access_token` | token, JWT, session | The short-lived (30 minutes) bearer token passed in the `Authorization: Bearer <token>` header to authenticate API requests. |
| **Refresh Token** | `refresh_token` | session token, cookie | The long-lived (7 days) rotating secret sent in `POST /auth/refresh` request body to issue a new access token. |
| **Setup Token** | `setup_token` / `X-Setup-Token` | install key, admin token | The single-use secret token passed in `X-Setup-Token` header during first-boot initialisation (`POST /setup/install`). |
| **Tenant** | `tenant`, `X-Tenant-ID` | organisation, account, company, workspace | The logical partition and multi-tenant data isolation boundary in Innostes ERP. Every tenant has a unique UUID and URL-safe slug. |
| **Organisation** | organisation | tenant | The real-world legal business entity (e.g. Northwind Traders Pvt Ltd). Use when discussing business operations, never as an API field or schema identifier. |
| **Resource** | resource | entity, endpoint | The HTTP URI entity exposed by REST operations (e.g. `/tenants`, `/users`). |
| **Record** | record | row, object, item | The database entity managed by the server and subject to soft deletion and audit logging. |
| **Status Code** | status code | HTTP code, error number | The three-digit RFC 9110 response code (`200 OK`, `201 Created`, `401 Unauthorized`, `422 Unprocessable Content`). |
| **Error Code** | error code / `code` | error type, failure id | The machine-readable programmatic string returned in `ErrorResponse.code` (e.g. `invalid_credentials`, `setup_required`, `tenant_not_found`). |
| **Soft Delete** | soft delete, deactivate | purge, erase, drop | Marking a record inactive by populating `deleted_at` and `deleted_by` while preserving the data for audit integrity. |
| **Audit Trail** | audit trail, audit fields | history, logs | The automatic server-managed tracking columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`. |

---

## 2. Style & Spelling Conventions

### British English Prose
All documentation prose adheres strictly to British English:
- **-ise over -ize**: authorise, initialise, categorise, recognise, standardise.
- **-our over -or**: behaviour, colour.
- **-ll- over -l-**: cancelled, labelling, modelling.
- **-gue over -g**: catalogue, dialogue.
- **-re over -er**: centre, metre.

### Sentence Case & Headings
- Operation summaries: Imperative sentence case, 60 characters or fewer, no trailing full stop (e.g. `Create a tenant`, `Log in with email and password`).
- Section titles and tag names: Sentence case (`User management`, `First-run setup`, `Error handling`).

### Banned Words & Marketing Fluff
The following words and patterns are strictly prohibited in technical documentation:
- *Banned*: "supercharge", "blazing fast", "effortless", "seamless", "delightful", "magic", "simply", "obviously", "just".
- *Replacement*: State objective facts, latency figures, or protocol specifications.

---

## 3. Enterprise Example Universe

All examples across guides, OpenAPI schemas, and reference pages belong to the canonical test universe:
- **Company**: Northwind Traders Pvt Ltd (distributor based in Bengaluru, Karnataka, India).
- **Users**:
  - `priya.shah@northwind.example` (Super Admin & Technical Lead)
  - `arjun.mehta@northwind.example` (Tenant Admin & Operations Manager)
- **Domain**: Only use the IETF reserved `.example` domain (`rfc2606`) for email addresses and hosts. Never use `@gmail.com`, `@test.com`, or `@northwind.com`.
- **Currency**: Indian Rupee (`INR` / `₹`).
- **Identifiers**:
  - Tenant ID: `3f2b1c9e-4d5a-6b7c-8e9f-0a1b2c3d4e5f`
  - User ID: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`
  - Tokens: Truncated realistic JWTs (`eyJhbGciOi...`).

---

## 4. Code Sample Style Across Languages

Every multi-language sample block provides code in `curl`, TypeScript (`fetch`), and Python (`httpx`):

### 1. `curl`
- Format with backslashes for readability.
- Use uppercase HTTP methods (`-X POST`, `-X GET`).
- Always pass `-H "Content-Type: application/json"` when sending JSON.
- Quote JSON payloads cleanly.

### 2. TypeScript (`fetch`)
- Use modern `async/await` with native `fetch`.
- Use TypeScript interfaces corresponding to Pydantic schemas.
- Set standard headers with `Record<string, string>`.
- Check `response.ok` and parse JSON safely.

### 3. Python (`httpx`)
- Use `httpx.AsyncClient` or `httpx.Client`.
- Use `client.post(..., json={...})`.
- Raise or inspect `response.status_code`.
- Handle `httpx.HTTPStatusError`.
