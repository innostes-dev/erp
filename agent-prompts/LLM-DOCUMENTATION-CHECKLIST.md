# Innostes ERP: Universal Documentation Standards & LLM Prompt Checklist

> **Purpose**: This specification is designed to be fed directly as an **LLM input / system prompt** or developer instruction whenever new code, features, APIs, UI components, modules, or architecture changes are introduced to the Innostes ERP monorepo.
> 
> It provides an unambiguous, generic contract ensuring all future code changes follow the exact same documentation patterns, editorial voice, quality standards, and automated verification gates.

---

## 1. Monorepo Architecture & Invariants

All code and documentation in this repository strictly adhere to a **decoupled two-engine architecture**:

| Layer | Path | Technology | Responsibility | Architectural Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Engine** | `apps/api-server` | FastAPI (Python 3.12+) | ASGI host, lifespan, OpenAPI export, `/health` | **Plumbing only**: Must NEVER contain business tables or domain endpoints. Discovers plug-ins dynamically via `innostes.modules`. |
| **UI Engine** | `apps/web-app` | React 19 + Vite 8 | Single-page app shell, setup/auth gates, layout | **Plumbing only**: Must NEVER contain domain business views. Mounts modules dynamically from `apps/web-app/src/app/catalog.ts`. |
| **Documentation Site** | `apps/landing` | Next.js 16 + Fumadocs | Developer docs (`/docs`), UI docs (`/ui/docs`), API docs (`/api-reference`) | Unified documentation platform. Statically prerenders all pages. |
| **Platform Kernel** | `kernel/` | Python + React | Foundation: database, tenancy, IAM, security | "The first plug-in". Shared by all modules; imports NO external plug-ins. |
| **Domain Business Modules** | `modules/` | Python + React | Self-contained domains (`hrms`, `crm`) | Independent packages implementing the two-engine plug-in contract. |
| **Platform Plug-ins** | `plugins/` | Python + React | Extensible telemetry & tooling (`api-logger`) | Optional extensions mounting via standard engine contracts. |
| **Design System** | `packages/ui` | React 19 + Tailwind CSS v4 | `@innostes/ui` reusable enterprise primitives | Headless Base UI foundation, multi-runtime compatible (React 17, 18, 19). |

### The 5 Architectural Invariants (Enforced in CI)
1. **Engines never import specific plug-ins** (discovered via entry points or catalog manifests).
2. **Plug-ins never import an engine** (no import from `apps/api-server` or `apps/web-app`).
3. **Kernel never imports external modules/plug-ins** (dependency flows downward only).
4. **Kernel core never imports feature modules** (`kernel.core` is strictly feature-agnostic).
5. **Layered feature hierarchy**: Imports flow strictly downward: `core` ← `setup` ← `tenancy` ← `user` ← `auth`.

---

## 2. Universal Documentation Principles

Whenever an LLM authors or modifies documentation in `apps/landing/content/`:

### 2.1 Diátaxis Framework Classification
Every document must have a single primary Diátaxis type. Do not mix procedures into explanations, or essays into runbooks:
- **Tutorial** (`getting-started.mdx`): Learning-oriented. Guides a newcomer from zero to a working system with a verified first change.
- **How-To Guide** (`content/dev-docs/guides/`, `operations/`): Task-oriented. Step-by-step instructions to solve a practical problem.
- **Reference** (`content/docs/` [UI components], `content/api-docs/` [REST APIs], ADRs): Information-oriented. Precise, technical specifications, props tables, and schemas.
- **Explanation** (`content/dev-docs/architecture/`): Understanding-oriented. Explains architecture, C4 views, concepts, trade-offs, and invariants.

### 2.2 Single Source of Truth (No Duplication)
- Every fact, rule, route, or setting has **exactly one canonical home**.
- Architecture pages own structural explanations and invariants.
- Developer guides own execution procedures.
- API Reference (`/api-reference`) owns endpoint schemas.
- UI Documentation (`/ui/docs`) owns component props and design tokens.
- **Cross-link instead of copying**: If a guide references an invariant or endpoint, link directly to it.

### 2.3 Honest About System State
- Clearly separate what is **built**, what is **partially built**, and what is **planned**.
- **Rule**: Planned features must **NEVER** be described in the present tense.
- Use the standard status callout:
  ```mdx
  <Callout type="info" title="Status">
    This capability is currently planned. What exists today is [X]; what does not exist yet is [Y].
  </Callout>
  ```

### 2.4 Editorial Style & Voice
- **Tone**: Plain, direct, authoritative enterprise engineering handbook voice.
- **Banned Words**: No marketing adjectives, hype, or fluff (e.g. *seamless*, *blazing fast*, *robust*, *supercharge*, *game-changer*).
- **No Emojis**: Emojis are strictly banned in documentation titles and prose (except status badges or callouts).
- **British English**: Use British spelling throughout (`colour`, `behaviour`, `authorisation`, `synchronise`, `centre`, `catalogue`, `licence` [noun] / `license` [verb], `organisation`).
- **Sentence Case**: All headings, titles, table headers, and operation summaries use sentence case (only capitalize the first letter and proper nouns).

### 2.5 Frontmatter Schema
Every MDX document must include frontmatter:
```yaml
---
title: Page Title in Sentence Case
description: Exactly one clear summary sentence ending with a full stop.
icon: ValidLucideIconName
# For architecture/operations pages:
owner: Platform Team Name or Role
lastReviewed: YYYY-MM-DD
# For arc42 architecture pages:
arc42: 1 # (or [5, 8], matching arc42 section numbers 1-12)
---
```

### 2.6 MDX Syntax Safety
- MDX compiles JavaScript JSX expressions.
- **Never** write raw `{` or `<` characters in prose. Always wrap them in backticks (`{param}`) or escape them.

---

## 3. Discipline-Specific Checklists

### 3.1 UI Components & Design System (`packages/ui` & `/ui/docs`)

When adding or modifying a component in `@innostes/ui`:

- [ ] **Location**: Documentation lives in `apps/landing/content/docs/components/<category>/<component>.mdx`.
- [ ] **Standard 10-Section Template**:
  1. **Frontmatter**: `title`, `description` (one sentence ending with a full stop), `icon`, `status: stable | beta | planned`, `summary`.
  2. **Lead Preview**: `<ComponentPreview>` displaying the primary enterprise scenario.
  3. **Import Snippet**: Exact import syntax (`import { Component } from '@innostes/ui';`).
  4. **When to use**: Clear guidelines comparing when to use this component vs. alternative primitives.
  5. **Anatomy**: `<Anatomy>` diagram or code block showing exported slots and subcomponents.
  6. **Examples & Variants**: Interactive demos showing variants, sizes, loading states, disabled states, and form bindings.
  7. **Accessibility**: WAI-ARIA role documentation, assistive technology notes, and `<KeyboardTable>`.
  8. **Guidelines**: `<DoDont>` pairs with explicit visual examples and recommendations.
  9. **API Reference**: `<ApiTable>` for all exported components, props, types, and defaults.
  10. **Related**: Links to related components or patterns.
- [ ] **Demo Registry**: Every demo must be placed in `apps/landing/components/demos/<category>/<component>/<demo>.tsx` and registered via `node apps/landing/scripts/generate-demo-registry.mjs`.
- [ ] **Multi-Runtime**: Compatible across React 17, React 18, and React 19.
- [ ] **Theming & Mobile**: Verified in light and dark themes; responsive without horizontal page overflow down to 360px viewport.

---

### 3.2 Backend REST APIs (`apps/api-server`, `kernel`, `modules/*`)

When adding or modifying a FastAPI route, schema, or backend module:

- [ ] **Operation ID (E1)**: Formatted as snake_case `<resource>_<action>` (e.g. `roles_create`, `tenants_list`).
- [ ] **Summary (E2)**: Imperative sentence case, <= 60 characters, with no trailing period (e.g. `Create a role`).
- [ ] **Docstring (E3)**: Public description before form-feed `\f`. Documents exact purpose, permitted actor roles, side-effects, and idempotency.
- [ ] **Tags & Security (E4, E5)**: Exactly one tag matching an `openapi_tags` entry; explicit security declared in `openapi_extra`.
- [ ] **Pydantic Schemas (S1–S8)**:
  - `<Resource>Create`: Required fields for insertion with validation bounds (`min_length`, `ge`, etc.).
  - `<Resource>Update`: All fields optional (`Field(default=None)`).
  - `<Resource>Read`: Inherits `AuditReadSchema` (`id`, `created_at`, `updated_at`, `created_by`, `updated_by`).
  - Every field has a descriptive `description="..."` and realistic `examples=[...]`.
- [ ] **Errors (E9, E10)**: Raise typed service error classes (`NotFoundError`, `ConflictError`, `ForbiddenError`), **never raw status codes**. Declare raised errors on the router via `responses=error_responses(RoleNotFoundError, ...)`.
- [ ] **Custom Headers (E11)**: Document `X-Tenant-ID` or `X-Setup-Token` where required.
- [ ] **Pagination (E12)**: List endpoints take `skip` and `limit <= 200` and return standard `Page[T]`.
- [ ] **OpenAPI Sync**: Regenerate spec and check freshness:
  ```bash
  pnpm nx run api-server:openapi
  pnpm nx run api-server:openapi-check
  pnpm nx run api-server:openapi-lint
  ```

---

### 3.3 Architecture & Decisions (`/docs/architecture`)

When adding architectural documentation, views, or records:

- [ ] **arc42 Alignment**: Align with the 12 arc42 sections (§1 Goals, §2 Constraints, §3 Context, §4 Strategy, §5 Building Blocks, §6 Runtime, §7 Deployment, §8 Cross-cutting, §9 Decisions, §10 Quality, §11 Risks/Debt, §12 Glossary).
- [ ] **Architecture Decision Records (ADRs)**:
  - Stored in `apps/landing/content/dev-docs/architecture/decisions/NNNN-<kebab-title>.mdx`.
  - Use the MADR 4.x template: Title, Status (`accepted` | `proposed` | `deprecated` | `superseded by NNNN`), Date, Deciders, Context, Options, Outcome, Consequences, Confirmation.
  - Numbered sequentially.
  - Registered in `decisions/meta.json` and `decisions/index.mdx` (or generated via `generate-adrs.py`).
- [ ] **Diagrams (D1–D7)**:
  - Written as version-controlled Mermaid fenced code blocks inside `<Diagram caption="...">`.
  - Use standard C4 (Context, Container, Component, Deployment), Sequence, or ER types.
  - Every element name must match real code symbols, models, routes, or containers (no fictitious boxes).
  - Every relationship must have protocol and direction (`calls over HTTP/JSON`, `SQL / asyncpg`).
  - Must render cleanly in both light and dark themes and fit 360px viewports (internal diagram scroll permitted, page overflow forbidden).
- [ ] **Fitness Functions**: Document any new architectural rule in prose and link to the automated fitness function enforcing it (Python `import-linter`, TypeScript boundaries, or unit test).

---

### 3.4 Operations & Runbooks (`/docs/operations`)

When documenting deployment, maintenance, or operations:

- [ ] **Location**: Stored in `apps/landing/content/dev-docs/operations/<topic>.mdx`.
- [ ] **Diátaxis Type**: How-to / Runbook.
- [ ] **Actionable Commands**: Provide copyable, verified bash/Docker/CLI commands with exact flags.
- [ ] **Prerequisites & Verification**: Every step specifies expected console output and validation checks.
- [ ] **Rollback**: Every destructive or stateful procedure includes step-by-step rollback instructions.

---

### 3.5 Business Modules & Plug-ins (`modules/*`, `plugins/*`)

When scaffolding or documenting a new module (e.g. HRMS, CRM, Invoicing):

- [ ] **Directory Layout**:
  ```text
  modules/<name>/
  ├── backend/
  │   ├── pyproject.toml     # declares innostes.modules entry point
  │   ├── <name>/            # Python package: router, models, schemas, services
  │   ├── migrations/        # per-module Alembic migrations
  │   └── tests/
  └── frontend/
      ├── package.json       # @innostes/<name>
      └── src/
          ├── index.ts       # exports ModuleManifest
          └── routes/
  ```
- [ ] **Backend Registration**: Registered under `[project.entry-points."innostes.modules"]` in `pyproject.toml`.
- [ ] **Frontend Registration**: Exported `ModuleManifest` registered in `apps/web-app/src/app/catalog.ts`.
- [ ] **Documentation**: Documented in `apps/landing/content/dev-docs/guides/creating-a-module.mdx` and registered in `module-catalog.json`.

---

## 4. Mechanical Quality Gates & Verification Commands

Before completing any task, an LLM or developer **must execute and pass** the uncached quality gates:

```bash
# 1. Architectural Fitness Functions & Dependency Boundaries
pnpm run arch-check
# Proves: 5 import-linter contracts, 167 TS boundary rules, and architectural unit tests.

# 2. Architecture & Documentation Gates
pnpm nx run landing:arch-docs-check
# Proves: Mermaid diagram parsing, frontmatter schema (A1), MADR compliance (R1-R9), 
#         12/12 arc42 coverage, internal link resolution, and module catalogue freshness.

# 3. Complete Documentation Quality Gates
pnpm nx run landing:docs-check
# Proves: 16 enforced gates (internal links, demos, sidebar, mdx safety, version consistency,
#         prose standards, British spelling, frontmatter completeness, API freshness).

# 4. Production Static Generation Build
pnpm nx build landing
# Proves: Complete Next.js SSG prerendering across all /docs, /ui/docs, and /api-reference routes.

# 5. TypeScript Monorepo Compilation
pnpm nx run-many -t build typecheck
# Proves: TypeScript types and Vite/Next.js builds pass cleanly across the monorepo.
```

### Stale-Generator Checks (If models, settings, or modules changed)
```bash
node apps/landing/scripts/generate-module-catalog.mjs --check
python apps/landing/scripts/generate-config-reference.py --check
python apps/landing/scripts/generate-data-dictionary.py --check
python apps/landing/scripts/generate-adrs.py --check
```

---

## 5. LLM Pre-Completion Self-Audit Checklist

Before declaring any coding or documentation task complete, verify this checklist:

```markdown
- [ ] 1. Diátaxis type of every new/changed page is clear and respected.
- [ ] 2. Zero duplicated facts (linked to single source of truth).
- [ ] 3. Planned vs built capabilities are explicitly distinguished via <Callout type="info" title="Status">.
- [ ] 4. All prose uses plain British English spelling (colour, behaviour, organisation, etc.).
- [ ] 5. Headings and summaries are written in sentence case without trailing periods.
- [ ] 6. Zero marketing adjectives, buzzwords, or emojis in prose and titles.
- [ ] 7. Frontmatter contains title, description ending in a full stop, icon, owner, and lastReviewed.
- [ ] 8. Every code symbol, route, and setting in prose or diagrams matches the real codebase.
- [ ] 9. Every stated architectural invariant is backed by an automated fitness function.
- [ ] 10. All 5 pre-commit verification gates run and pass cleanly uncached.
```
