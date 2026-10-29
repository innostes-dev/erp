# Progress log

Each agent appends one entry, in the format from `STANDARDS.md` §7, at the bottom.

## 00 – Seed notes – 2026-10-28

Observed before the runbook started. Prompt 01 must verify every one.

- The existing architecture pages (`content/dev-docs/architecture/`, about 600 lines) are:
  - `overview.mdx`: engines, plug-ins, dependency rules, the request flow, the repository layout
  - `kernel.mdx`: backend and frontend layout, feature layout, common columns, soft delete, the
    base service, "who made the change", migrations
  - `plugins.mdx`: backend and frontend plug-ins
  - `setup.mdx`: security layers, endpoints, command-line and web install, the production checklist
- The diagrams are ASCII art in `text` code blocks. There are no C4 views, no sequence diagrams and
  no entity diagrams.
- `overview.mdx` states three dependency rules. Nothing in CI appears to enforce them: check for
  `import-linter` and for Nx module-boundary tags.
- `overview.mdx` has a status callout. It says a page loader in `web-app`, so that plug-ins can
  register pages and menus, is "still to come". Verify the current state.
- There are no ADRs, no quality goals or scenarios, no risk or debt register, no glossary, no
  deployment view, no configuration reference, no runbooks and no threat model.
- Infrastructure facts:
  - `docker-compose.yml` runs Postgres 16 and api-server, with `AUTO_MIGRATE`, `APP_ENV` and
    `JWT_SECRET_KEY` (with an insecure development default)
  - settings live in `kernel/backend/kernel/core/config/settings.py`: CORS, token lifetimes, SMTP,
    and so on
- Security-relevant parts to cover in the threat model:
  - JWT access and refresh tokens with rotation (`kernel/core/security`)
  - `kernel/core/crypto/cipher.py`
  - the setup token with attempt limiting (`kernel/setup`)
  - the user models for roles and permissions (RBAC), sessions, devices and password history
  - tenant membership and the `X-Tenant-ID` header

## 01 – Audit – 2026-10-29
**Summary**: Completed comprehensive architectural audit. Verified every claim across dev-docs against code, audited dependency rule enforcement, recovered architectural facts across engines, kernel, modules, and plugins, analyzed arc42 gaps for all 12 sections, catalogued 16 candidate ADRs, and inventoried the threat surface for STRIDE threat modelling. Generated `agent-prompts/architecture-docs/AUDIT.md` containing 13 formal findings (`ARC-001` through `ARC-013`).
**Changed**: Created `agent-prompts/architecture-docs/AUDIT.md`, updated `PROGRESS.md`, deleted `01-audit.md`.
**Code changes**: none (pure audit phase).
**Decisions**: Recorded 16 candidate ADRs in AUDIT.md to be authored in Prompt 09.
**Verification**: Verified baseline with `pnpm nx build landing` (passed cleanly, 249 pages), `pnpm nx run-many -t test` (passed cleanly, 6 projects, 120 Python tests), and inspection of all 18 SQLAlchemy models.
**Open issues**:
- Non-blocking: `ARC-001` through `ARC-013` (tracked in `AUDIT.md` with assigned owner prompts).

