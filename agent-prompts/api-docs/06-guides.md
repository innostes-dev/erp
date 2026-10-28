# 06 – Guides for API callers

## Role

You are the lead technical writer for the API, and a backend engineer. The reference says what each
endpoint does. The guides teach callers how to use the API correctly from start to finish. Every
statement must be backed by code and a test (G2), and every sample must have been run (G3).

## Read first

- `STANDARDS.md`: §4 voice and samples, §5 G1–G8, §6 verifying examples
- `PROGRESS.md`: the behaviour-fact tests from prompt 04, which you cite
- `AUDIT.md` § "Behaviour notes"
- the reference from prompt 05

## Pages (in `content/api-docs`, under a "Guides" section in `meta.json`)

1. **Quickstart**:
   - from nothing to the first authenticated call in under 10 minutes
   - run the server locally, complete first-run setup, log in, call `GET /auth/me`, create and list
     a tenant
   - Every step has samples in `curl`, TypeScript and Python, with real outputs.
2. **Authentication**:
   - login
   - the access and refresh tokens and their default lifetimes, naming the settings that change them
   - refresh rotation (what happens to the old token), logout and revocation
   - change, forgot and reset password flows (what is emailed, the link and temporary-password
     validity)
   - which endpoints need a token
   - handling `401` with a refresh-and-retry loop (a complete TypeScript example)
   - storing tokens safely in a browser app (the recommendation and its trade-offs)
3. **Tenants and the `X-Tenant-ID` header**: when it's required, how the tenant is chosen, and the
   errors for a missing, invalid or non-member tenant. Only document behaviour that exists.
4. **First-run setup**: the setup status and checks endpoints, the setup-token header and where the
   token comes from, the attempt limit, and what setup creates. For operators.
5. **Errors**:
   - the `ErrorResponse` shape
   - the `422` validation shape, with a real example
   - the status codes the API uses, and what each means for a caller
   - retry guidance (which errors are safe to retry, and `Retry-After`)
   - a link to the error-code catalogue (prompt 07)
   - a complete TypeScript error-handling helper
6. **Pagination, filtering and sorting**: `offset` and `limit` (bounds and defaults), `total`,
   iterating all pages (TypeScript and Python helpers), and the sort order guarantees, or their
   absence.
7. **Records, audit fields and soft delete**: IDs, timestamps (UTC, ISO 8601), the audit fields and
   who sets them, soft delete, `include_deleted`, restore, and how they interact with uniqueness
   (for example a slug conflict with a deleted tenant). Verify that edge case and document it.
8. **Generating a typed client**: from the published `openapi.json` with `openapi-typescript`
   (and/or `openapi-fetch`), plus a Python option. Show the generated types used in a real call.
   Run it.
9. **Environments and CORS**: base URLs, `CORS_ORIGINS` for browser apps, health checks
   (`/health`) for load balancers and monitoring, and what `/config` exposes.

## Rules

- Document only behaviour that exists today. If a guide needs something that's missing (for example
  rate-limit headers on all endpoints), write the honest current behaviour and add an `AUDIT.md`
  item.
- No architecture explanations (G8).
- Each page lists the tests that back its claims, in `PROGRESS.md`.

## Definition of done

- All nine guides meet G1–G8.
- Every sample was executed (record the commit and date), and its output is real.
- They're linked from the reference overview and from the related operations.
- `pnpm nx build landing` passes.
- Commit as `docs(api): guides for API callers`.
- STANDARDS §8 is met.
