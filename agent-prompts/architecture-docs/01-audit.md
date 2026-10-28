# 01 – Audit (verify every claim, map every gap, fix nothing)

## Role

You are a principal software architect doing an architecture documentation review before a platform
goes to wider teams. Find every inaccurate claim, every gap against arc42, and every decision baked
into the code that was never recorded.

## Read first

`STANDARDS.md` (in full), `PROGRESS.md` (the seed notes are leads), every file in
`apps/landing/content/dev-docs/`, `README.md` at the repo root, and the READMEs of `apps/api-server`,
`apps/web-app`, `kernel/backend` and `kernel/frontend`.

## Setup

Run `git status` (stop if there's uncommitted work you didn't make). Create the branch
`docs/architecture`. Run `pnpm nx build landing` and record the baseline.

## Tasks

1. **Claim verification**:
   - For every page in `content/dev-docs/`, list every factual claim: names, paths, flows, rules,
     defaults, counts and status statements.
   - Verify each one against the code: read it, and run it where needed (start the API, load the
     web app, run the migrations).
   - Record each claim as true, false or partly true, with the `file:line` evidence.
2. **Rule enforcement**: for every stated rule (the dependency rules, the plug-in contract, the
   layering), check whether anything enforces it. Then check whether the code currently obeys it:
   search the imports across `kernel`, `apps/*` and the plug-ins. A violation is a finding, and so is
   a rule with no enforcement.
3. **Architecture recovery**: build your own accurate picture from the code:
   - the containers and their protocols
   - the backend and frontend module structure
   - the plug-in discovery mechanism (backend: the module registry and loader; frontend: how
     `web-app` consumes `@innostes/kernel`)
   - the request lifecycle, including middleware, setup gating, auth, tenant resolution, services and
     error mapping
   - the data model (every SQLAlchemy model and relation)
   - configuration (every setting, its environment variable and its default)
   - the deployment artefacts
   - CI

   Write it as **notes with evidence** in `AUDIT.md` § "Recovered architecture". Later prompts build
   pages from these notes.
4. **arc42 gap analysis**: for each of the 12 arc42 sections, say what exists, where it is, its
   quality (A1–A10), and what's missing.
5. **Candidate ADRs**: every significant decision visible in the code. For example:
   - the plug-in architecture
   - FastAPI
   - React and Vite for the UI engine
   - Postgres
   - SQLAlchemy and Alembic
   - per-plug-in migrations
   - UUID IDs
   - soft delete everywhere
   - audit columns
   - JWT access and refresh tokens with rotation
   - multi-tenancy via tenant membership and the `X-Tenant-ID` header
   - a setup token for first run
   - the Nx monorepo with pnpm
   - a Python virtualenv per app
   - Base UI and Tailwind for the UI library
   - Fumadocs for the docs

   For each one, give the evidence, what's known about the rationale (from commits, docs and
   comments), and what isn't known.
6. **Threat-surface inventory**: entry points, trust boundaries, secrets, sensitive data stores, and
   authentication and authorisation checkpoints (input for prompt 08).

## Deliverable: `agent-prompts/architecture-docs/AUDIT.md`

The sections are:

- Baseline
- Summary (the five most damaging inaccuracies or gaps)
- Claim verification table
- Rule enforcement table
- Recovered architecture (notes with evidence)
- arc42 gap analysis
- Candidate ADRs
- Threat-surface inventory
- Findings: `| ID | Severity | Checklist | Location | Finding | Fix | Owner prompt |`, with IDs
  `ARC-001…`. Severity:
  - `S1`: a false claim, or a rule that's violated
  - `S2`: missing
  - `S3`: polish

## Rules

Change no source or docs files. Write only `AUDIT.md` and `PROGRESS.md`. Delete any throwaway
scripts.

## Definition of done

`AUDIT.md` is complete, with evidence for every row. Commit as `chore(docs): architecture
documentation audit`. STANDARDS §7 is met.
