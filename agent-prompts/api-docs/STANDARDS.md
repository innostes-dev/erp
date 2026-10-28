# Standards and checklists for the API documentation runbook

Read this file in full before you change anything. Where it conflicts with a prompt, the prompt wins
for that task only.

## 1. The bar

The API reference and guides must match the standard of mature public APIs (Stripe, GitHub, Twilio,
Atlassian). A developer who has never seen this codebase must be able to authenticate, make correct
calls, handle every error and paginate, **using only the docs**, without reading source code.

The docs must contain:

- no endpoint, parameter, field, header, status code or error code that is undocumented, or
  documented but not real
- no example that fails when run, or that doesn't validate against its schema
- no drift between the code, the committed `openapi.json` and the rendered reference
- no internal implementation detail leaking into public text
- no marketing language

Every statement is verifiable against the code and the tests.

## 2. Repository facts

- **Server**: `apps/api-server` (FastAPI). `app/engine/server.py` builds the app and mounts each
  registered module's `router`. Engine endpoints: `GET /`, `GET /config`, `GET /health`.
- **Endpoints** come from kernel modules in `kernel/backend/kernel/`:
  - `auth` (`/auth/*`): login, refresh, forgot and reset password, change password, logout, `/me`
  - `setup` (`/setup*`): first-run setup, guarded by a setup-token header with attempt limiting
  - `tenancy` (`/tenants*`): create, list, get, update, soft delete, restore
  - `user` (`/users*`)
  - Each module has `router.py`, `schemas/` and `services/`. Its `BaseModule` subclass declares
    `openapi_tags`.
- **Existing documentation rules**, in `kernel/backend/README.md` § "Documentation standards".
  These are the starting point and must stay in sync with this file:
  - route decorators take `summary=`, `response_description=`, `operation_id="<feature>_<action>"`
    and `responses=error_responses(<error classes>)`; never numeric status codes
  - in an endpoint docstring, the text **before `\f`** is public and the text after it is for
    developers only
  - schemas: `Field(description=..., examples=[...])` on every field, plus a full example in
    `model_config["json_schema_extra"]` for read schemas
- **Errors**: `kernel/core/services/errors.py` has one class per HTTP status. Each declares its
  `status_code` and `description`. `kernel/core/http.py` maps raised errors to responses. The body
  is `ErrorResponse {detail, code?}` (`kernel/core/schemas/errors.py`). Validation errors (422)
  return FastAPI's list of field problems.
- **Conventions** already stated in the spec's `info.description`:
  - IDs are UUIDs; timestamps are ISO 8601 in UTC
  - audit fields on every record
  - delete is a soft delete, with restore; `include_deleted=true` shows deleted records
  - pagination uses `offset` and `limit`, and returns `{items, total, offset, limit}`
  - authentication is `Authorization: Bearer`
  - Verify each one against the code. Don't trust it.
- **Other real behaviour to document**:
  - the `X-Tenant-ID` request header (`kernel/auth/dependencies.py`)
  - the setup-token header (`kernel/setup/dependencies.py`)
  - token lifetimes and CORS from settings (`kernel/core/config/settings.py`)
  - `Retry-After` on `TooManyRequestsError`
- **Commands**:

  | Purpose | Command |
  | --- | --- |
  | Install the virtualenvs | `pnpm nx run api-server:install` |
  | Serve the API | `pnpm nx serve api-server` (http://localhost:8001, Swagger at `/docs`) |
  | Engine tests | `pnpm nx test api-server` |
  | Kernel tests | `pnpm nx test kernel-backend` |
  | Export the spec | `pnpm nx run api-server:openapi` (writes `apps/api-server/openapi.json`) |
  | Docs site | `pnpm nx dev landing` / `pnpm nx build landing` (Fumadocs) |

  Check `project.json` files for further targets before you invent commands.
- **Docs site**: `apps/landing` hosts two collections, the UI docs (`content/docs` → `/ui/docs`) and
  the developer docs (`content/dev-docs` → `/docs`). The API docs become a third collection (prompt
  05). The route `/api/*` is used by Next.js route handlers (`app/api/search`), so don't serve the
  docs under `/api`. Prompt 05 chooses the URL (suggested: `/api-reference`).

## 3. Known traps

- **Line endings**: files are mixed CRLF and LF. Python text-mode writes on Windows produce CRLF.
  After editing, check `git diff --stat`, and restore the original endings if a whole file changed.
- **`\f` in docstrings**: anything after it is hidden from the spec. Public text placed after `\f`
  silently disappears.
- **Spec freshness**: the committed `openapi.json` can lag behind the code. Always regenerate it
  before you audit or render the spec, and treat a diff as a finding.
- **Windows virtualenvs** live in `.venv/Scripts/`, not `.venv/bin/`. Use the repo's node wrapper
  scripts (`scripts/venv-python.js`), which handle both.
- **MDX braces**: `{` in prose breaks the docs build. Use code spans.

## 4. Writing standard

Use the same voice and style as the UI docs: follow `agent-prompts/ui-docs-overhaul/STANDARDS.md` §5
(voice, British English, sentence case, the banned word list). API-specific additions:

- Write for the caller. Say what an endpoint does, who may call it, what changes, and what can go
  wrong. Never describe how it's implemented.
- Summaries are imperative and in sentence case, 60 characters or fewer, with no full stop:
  "Create a tenant". Descriptions are full sentences.
- Use the HTTP names consistently: "request body", "query parameter", "path parameter", "header",
  "status code", and "error code" (the `code` field).
- **Example data**:
  - the Northwind universe (Northwind Traders Pvt Ltd; people such as Priya Shah and Arjun Mehta)
  - email addresses only on the reserved `.example` domain (`priya.shah@northwind.example`)
  - placeholder tokens that are obviously fake and correctly shaped (`eyJhbGciOi…`, shortened with
    an ellipsis)
  - UUIDs that are valid but obviously illustrative (`3f2b1c9e-…` written out in full)
  - no real secrets or personal data, ever
- **Code samples** in every guide and on the reference: `curl`, TypeScript (`fetch`) and Python
  (`httpx`). They must have been executed against a local server (§6).

## 5. Checklists

Each item has an ID. Audits, gates and the final verification refer to these IDs.

### Endpoint checklist (every operation)

| ID | Requirement |
| --- | --- |
| E1 | `operation_id` is `<feature>_<action>`, in snake case, unique and stable. Renaming one is a breaking change for generated clients. |
| E2 | `summary`: imperative, sentence case, 60 characters or fewer, no full stop. |
| E3 | Public description (the docstring before `\f`) says what the endpoint does, who may call it (authentication and permission), its side effects (emails sent, sessions revoked, audit fields set, records restored) and its idempotency. It contains no internal details. |
| E4 | Exactly one tag, and that tag is described (see T1–T3). |
| E5 | The security requirement in the spec matches the real dependency: bearer required, bearer optional, setup-token header, or public. Public endpoints are explicitly public. |
| E6 | Every path, query and header parameter has a description, an example, a format (for example `uuid`), constraints (min, max, pattern) and its default. |
| E7 | Request body: every field is documented (S1–S8), the required set is correct, and there is a complete request example. |
| E8 | Success response: the correct status code (`201` for create, `204` for no content, `200` otherwise), `response_model`, `response_description` and a complete example. |
| E9 | `responses=error_responses(...)` lists **exactly** the errors the endpoint can return. Trace them through the service code. Include `401`/`403` when authentication applies, and `422` when there are parameters or a body. No status code can occur that isn't documented. |
| E10 | Every machine `code` value the endpoint can return is listed in the error-code catalogue (prompt 07) and linked from the description. |
| E11 | Request headers (`X-Tenant-ID`, the setup token) and response headers (`Retry-After`, `Location` if used) are declared in the spec. |
| E12 | List endpoints use the `Page` schema. They document the `offset` and `limit` bounds and defaults, the sort order, the filters, and `include_deleted`. |
| E13 | Delete and restore endpoints state the soft-delete semantics, and what happens to related records. |
| E14 | Deprecated operations set `deprecated=True`, name the replacement and give the removal date. |
| E15 | Every example in the spec validates against its schema (automated, prompt 02). |
| E16 | Contract tests cover every documented status code of the endpoint (prompt 04). |
| E17 | Examples contain no real secrets or personal data (§4). |

### Schema checklist (every request and response model)

| ID | Requirement |
| --- | --- |
| S1 | The class docstring becomes the schema description: what the object represents. |
| S2 | Every field has `description=` and `examples=[...]`. |
| S3 | Constraints are declared in the schema (`max_length`, `pattern`, `ge`/`le`, `format`), not only enforced in service code. |
| S4 | Enums list every value with its meaning. |
| S5 | Optional versus nullable is correct, and matches what the API actually sends and accepts. |
| S6 | Read schemas have a complete, realistic example in `json_schema_extra`. |
| S7 | Naming is consistent: `<Entity>Create`, `<Entity>Update`, `<Entity>Read` (or whatever convention the audit finds dominant). The choice is recorded in `kernel/backend/README.md`. |
| S8 | No internal or sensitive fields leak into response schemas (password hashes, internal flags, token hashes). |

### Tag checklist (every `openapi_tags` entry)

| ID | Requirement |
| --- | --- |
| T1 | It has a description: what the area covers, and who uses it. |
| T2 | The tag order is logical (General → Authentication → Setup → Tenancy → User management → …), set in one place. |
| T3 | Tag names are in sentence case and consistent ("User management", not "User Management"). Renaming a tag changes the reference's URLs, so record it in the changelog. |

### Guide page checklist (every hand-written page)

| ID | Requirement |
| --- | --- |
| G1 | Written for API callers, and task oriented: it opens with what the reader will achieve. |
| G2 | Every behaviour described exists in the code and is covered by a test. Cite the test in `PROGRESS.md`. |
| G3 | Code samples in `curl`, TypeScript and Python, executed against a local server, with outputs captured from real responses. |
| G4 | Links to the reference for every endpoint and schema it mentions. |
| G5 | Covers the failure paths: the errors the reader will hit, and how to handle them. |
| G6 | Follows the voice, spelling and example-data rules (§4). |
| G7 | Frontmatter is complete (`title`, `description`, `icon`), and the page is listed in `meta.json`. |
| G8 | No architecture explanation beyond what a caller needs. |

## 6. Verifying examples

A sample is "executed" when you have:

1. started the server (`pnpm nx serve api-server`) against a fresh local database, set up with the
   documented setup flow
2. run the exact sample
3. pasted the real response, trimmed with an ellipsis where it's long

Record the date and the commit in `PROGRESS.md`. Prompt 09 re-runs every sample.

## 7. Engineering rules

- Fix root causes. Never weaken a gate, test or lint rule to get green.
- Documentation changes in code (docstrings, `Field` descriptions, `responses=`) are in scope.
  **Behaviour changes are not**, unless the audit proves the behaviour is a bug. Then fix it, add a
  test, and record it under "API changes" in `PROGRESS.md`.
- A change to the spec's shape (status codes, field names, `operation_id`s, tags) is a breaking
  change for clients. Record each one in `PROGRESS.md` and in the API changelog (prompt 07).
- Keep diffs in scope. Out-of-scope defects go into `AUDIT.md` with an ID.
- Work on the branch `docs/api-reference`. Commit at the end of each prompt with a conventional
  message. Never push or rewrite history.

## 8. Definition of done (every prompt)

1. The prompt's tasks are done, or listed as open in `PROGRESS.md` and marked blocking or
   non-blocking.
2. These pass, run uncached (`--skip-nx-cache`):
   - `pnpm nx test api-server`
   - `pnpm nx test kernel-backend`
   - `pnpm nx run api-server:openapi`, with no diff left uncommitted
   - the API docs gates from prompt 02 onwards
   - `pnpm nx build landing` from prompt 05 onwards
3. Docs pages you changed were checked in the dev server, in light and dark themes, at desktop and
   360px widths, with no console errors. If you couldn't check, say so.
4. `git diff --stat` shows no accidental line-ending rewrites.
5. Your `PROGRESS.md` entry is appended, and you have committed.

`PROGRESS.md` entry format:

```markdown
## NN – <title> – <date>
**Summary**:
**Changed**:
**API changes** (spec shape or behaviour): none | list
**Decisions**:
**Verification**:
**Open issues** (blocking / non-blocking, with IDs):
```
