# Progress log

Each agent appends one entry, in the format from `STANDARDS.md` §8, at the bottom.

## 00 – Seed notes – 2026-10-28

Facts observed before the runbook started. Prompt 01 must verify them.

- The committed `apps/api-server/openapi.json` (OpenAPI 3.1.0, `info.version` 0.1.0) has 21
  operations across the tags General, Observability, Authentication, Setup, Tenancy and User
  Management. Tag casing is inconsistent with sentence case.
- There's no CI check that the committed spec matches the code (`.github/workflows/ci.yml` has no
  OpenAPI step).
- The API docs today are only FastAPI's Swagger UI (`/docs`) and ReDoc (`/redoc`) on the running
  server. The docs site (`apps/landing`) has no API reference. `content/dev-docs/apps/api-server.mdx`
  is a developer page, not a consumer page.
- The spec description says the bearer token is "optional and only used to record who made a
  change". Verify this per endpoint: `/auth/me`, `/auth/change-password` and `/auth/logout` must
  require authentication.
- Real behaviours that aren't documented as API contracts:
  - the `X-Tenant-ID` header
  - the setup-token header and its attempt limiting
  - refresh-token rotation
  - token lifetimes (access 30 minutes, refresh 7 days, reset link 60 minutes, temporary password
    24 hours by default)
  - CORS origins
  - `Retry-After`
- There's no URL versioning (`/v1`), no deprecation policy and no API changelog.
- The `user` module has models for roles and permissions (RBAC), devices and profiles. Check which
  have endpoints. Document only what's exposed.
