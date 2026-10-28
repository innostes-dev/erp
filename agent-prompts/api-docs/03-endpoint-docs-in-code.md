# 03 – Endpoint documentation in code

## Role

You are a senior backend engineer who owns the public API contract. The reference is generated from
the code, so the code is where you fix it. Make every operation, schema and tag meet the endpoint,
schema and tag checklists.

## Read first

`STANDARDS.md` (§5 is your spec), `PROGRESS.md`, `AUDIT.md` (every `API-*` item owned by 03), and
`kernel/backend/README.md`.

## Scope

- `kernel/backend/kernel/*/router.py`, `*/schemas/*` and the module classes' `openapi_tags`
- `kernel/core/schemas/*` (`Page`, `ErrorResponse`, the audit schemas)
- the engine endpoints in `apps/api-server/app/engine/server.py`
- the app-level `info` (title, description, version, contact, licence, servers) and the security
  schemes

## Tasks

1. **Security schemes**: declare them properly. That's bearer JWT (with a description of where
   tokens come from and their lifetimes, taken from settings), and the setup-token API key header.
   Apply the correct requirement per operation (E5): required, optional (OpenAPI 3.1 allows `[{}]`
   alongside the scheme) or public. If the audit shows the real behaviour is wrong (for example,
   `/auth/me` reachable without a token), that's a bug. Fix it with a test, and record it under "API
   changes".
2. **Per operation** (E1–E14 and E17):
   - Write the public description before `\f`, and move developer notes after it.
   - Set `summary`, `operation_id` and `response_description`.
   - Make `responses=error_responses(...)` match the traced errors **exactly** (E9). Add any error
     classes or `code` values needed to make errors distinguishable for callers. That's a behaviour
     change: record it.
   - Declare the headers (E11).
   - Document the pagination and filter parameters (E12).
   - Use the correct success status (E8). Changing a status code is a breaking change: record it,
     and do it only if the current one is wrong.
3. **Per schema** (S1–S8): descriptions, examples, constraints declared in the schema, enum value
   meanings, a correct optional versus nullable, full read examples, consistent names, no leaked
   fields. Use the example-data rules in STANDARDS §4.
4. **Tags** (T1–T3): descriptions, order and sentence case. Renaming tags changes the reference
   URLs, so record it.
5. **App info**:
   - a description that summarises the conventions, short and accurate, with details moved to the
     guides in prompt 06
   - `version` (decide how it relates to releases; record the decision for prompt 07)
   - `contact`
   - `license` (match the repo licence)
   - `servers` (local, plus a placeholder for production with a variable, if that's appropriate)
6. **Update `kernel/backend/README.md` § "Documentation standards"** so it matches STANDARDS §5
   exactly, including the naming convention you settled for S7.
7. Regenerate and commit `openapi.json`. Remove every rule you fixed from the gate's report-mode
   list. The goal is an empty list.

## Definition of done

- All `API-*` items owned by 03 are fixed or justified.
- The lint report-mode list is empty, or every remaining entry is justified in `PROGRESS.md`.
- Tests pass, and every behaviour fix has a test.
- The spec is regenerated and committed.
- Commit as `docs(api): document every endpoint and schema at the source`.
- STANDARDS §8 is met.
