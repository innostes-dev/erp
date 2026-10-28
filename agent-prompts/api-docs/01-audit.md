# 01 – Audit (score everything, fix nothing)

## Role

You are a principal API engineer who reviews public APIs before they're opened to partners. Score
every operation, schema and tag against the checklists, and record the result so precisely that the
next agents can fix each item without asking questions.

## Read first

`STANDARDS.md` (in full, especially §5), `PROGRESS.md` (the seed notes are leads, not facts),
`kernel/backend/README.md`, `apps/api-server/README.md`, and every `router.py`, `schemas/*` and
`services/*` file under `kernel/backend/kernel/`. Also read `apps/api-server/app/engine/*`,
`kernel/backend/kernel/core/http.py`, `core/schemas/*` and `core/services/errors.py`.

## Setup

1. Run `git status`. If there's uncommitted work you didn't make, stop and record it.
2. Create the branch `docs/api-reference`.
3. Install the environments, run `pnpm nx test api-server` and `pnpm nx test kernel-backend`, and
   regenerate the spec with `pnpm nx run api-server:openapi`. Record the baseline. A diff in the
   regenerated `openapi.json` is a finding: the committed spec was stale.

## What to audit

1. **Inventory**: every operation in the regenerated spec, and every route in the code. Flag routes
   missing from the spec and spec entries without a route.
2. **Per operation**: E1–E17. For E9, trace every code path through the service and record which
   errors can actually be raised, against which are documented. For E5, compare the real
   dependency with the spec's `security`.
3. **Per schema**: S1–S8. For S5, check what the service actually returns (for example, `null`
   versus a missing key).
4. **Per tag**: T1–T3.
5. **Cross-cutting behaviour**, verified in the code:
   - authentication (required or optional per endpoint)
   - token lifetimes and rotation
   - `X-Tenant-ID` semantics (when required, what happens if it's missing or invalid, membership
     checks)
   - the setup token and its attempt limit
   - CORS
   - error body shapes (`ErrorResponse`, versus the 422 list, versus unhandled 500s)
   - pagination bounds
   - soft delete and `include_deleted`
   - audit fields
   - rate limiting
   - any headers the server sets
6. **Run it**: start the server, perform the setup flow, call every endpoint once on its happy path
   and once per documented error, and compare the real responses with the spec. Write a throwaway
   script and delete it afterwards. Every mismatch is a finding.
7. **Existing docs**: `apps/api-server/README.md`, `content/dev-docs/apps/api-server.mdx` and the
   spec's `info.description`. Check them for accuracy only.

## Deliverable: `agent-prompts/api-docs/AUDIT.md`

```markdown
# API documentation audit – <date>
## Baseline
## Summary            (counts per checklist ID; the five worst problems for an integrator)
## Operation matrix   (one row per operation: E1…E17 as ✓/✗/n/a)
## Schema matrix      (one row per schema: S1…S8)
## Tag matrix
## Behaviour notes    (the verified facts for the guides in prompt 06, each with a file:line)
## Findings
| ID | Severity | Checklist | Location | Finding | Fix | Owner prompt |
```

- IDs are `API-001…`.
- Severity:
  - `S1`: wrong (the spec contradicts the behaviour, an undocumented status code, a leaked field)
  - `S2`: missing
  - `S3`: polish
- Owner prompts follow the README table.

## Rules

Change no source files. Only `AUDIT.md`, the regenerated `openapi.json` (commit it **only** if it
was stale, as a separate commit), and `PROGRESS.md`.

## Definition of done

`AUDIT.md` is complete. Every operation, schema and tag is scored, and every scored item has
evidence. Commit as `chore(api): add API documentation audit`. STANDARDS §8 is met.
