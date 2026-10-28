# Standards and checklists for the architecture documentation runbook

Read this file in full before you change anything. Where it conflicts with a prompt, the prompt wins
for that task only.

## 1. The bar

The documentation must read like the architecture documentation of a well-run enterprise platform
team. It must be:

- **True**: every statement matches the code at the commit it was written.
- **Honest about state**: what is built, what is partly built and what is planned are clearly
  separated. Planned work is never described as if it exists.
- **Standard**: structured by arc42, with diagrams in C4, decisions in MADR, and page types per
  Diátaxis.
- **Enforced**: rules the docs state (for example "the kernel never imports a plug-in") are checked by
  automated tests (fitness functions), and the docs link to those tests.
- **Maintained**: every page has an owner and a last-reviewed date, and lives next to the code. It is
  changed in the same pull request as the code it describes.

## 2. Repository facts (verify; don't trust)

- Nx monorepo with pnpm. The apps are:
  - `apps/api-server`: the backend engine (FastAPI), which mounts backend plug-ins
  - `apps/web-app`: the UI engine (React and Vite), which renders frontend plug-ins
  - `apps/landing`: the docs site (Next.js and Fumadocs)
- **Kernel**: `kernel/backend` (Python package `kernel`) and `kernel/frontend` (`@innostes/kernel`).
  It is "the first plug-in". The backend modules are `core` (config, crypto, database, module
  registry, schemas, security, services), `auth`, `setup`, `tenancy` and `user`.
- **Shared packages**: `packages/ui` (`@innostes/ui`).
- **Infrastructure**:
  - `docker-compose.yml`: Postgres 16 and api-server
  - `apps/api-server/Dockerfile`
  - Alembic migrations (`kernel/backend/migrations`, `alembic.ini`)
  - the CI workflow in `.github/workflows/ci.yml`
- **Existing architecture docs** live in `apps/landing/content/dev-docs/architecture/`
  (`overview.mdx`, `kernel.mdx`, `plugins.mdx`, `setup.mdx`), plus `project-structure.mdx`,
  `getting-started.mdx`, `apps/*.mdx` and `guides/*.mdx`. They're served at `/docs`. They contain
  stated rules (for example "Dependency rules" in `overview.mdx`) and status callouts about planned
  work. Every claim must be re-verified.
- **Other records**: `PENDING.md` (a work log, not documentation), `AGENTS.md` and `CLAUDE.md`
  (agent instructions; not part of the docs).
- **API reference** (from the API runbook, if it has run) is at `/api-reference`, and the UI library
  docs are at `/ui/docs`. Link to them; don't copy them.

## 3. Where documents live

| Content | Location | arc42 | Diátaxis type |
| --- | --- | --- | --- |
| Architecture views and concepts | `content/dev-docs/architecture/` | 1–8, 10–12 | Explanation and reference |
| Architecture decision records | `content/dev-docs/architecture/decisions/NNNN-title.mdx` | 9 | Reference |
| Operations runbooks | `content/dev-docs/operations/` | 7 (supporting) | How-to |
| Developer guides | `content/dev-docs/guides/` (existing) | – | How-to |
| Getting started | `content/dev-docs/getting-started.mdx` (existing) | – | Tutorial |

**Diagrams** are code, in Mermaid inside the MDX, so they're versioned, diffable and reviewed.
Where a diagram is **generated** from code (entity diagrams, module catalogue), the generator script
lives in the repo, and a check fails when the output is stale.

## 4. Writing standard

Use the voice and style rules in `agent-prompts/ui-docs-overhaul/STANDARDS.md` §5: plain and precise,
British English, sentence case, and the banned word list. Architecture-specific additions:

- **Explain why, not only what.** Every significant structure links to the ADR that chose it.
- **Name things exactly as the code does** (module, class, table, setting and route names) in code
  spans, and keep the terms consistent with the glossary (arc42 §12).
- **Status markers**: use a `<Callout type="info" title="Status">` when a described part is
  partly built or planned. State what exists today, and what doesn't, in one or two sentences. No
  promises with dates unless they're in a real plan.
- **Evidence**: when a page states a rule or a guarantee, link to the code or the test that enforces
  it (a file path, a test name or a fitness function).
- No architecture astronautics. Describe the system as it is. Generic theory belongs in a link to
  the standard, not in the page.

## 5. Checklists

### Architecture page checklist (every page under `architecture/` and `operations/`)

| ID | Requirement |
| --- | --- |
| A1 | Frontmatter has `title`, `description`, `icon`, plus `owner` (a team or role) and `lastReviewed` (ISO date). Prompt 02 extends the schema. |
| A2 | It maps to an arc42 section, named in the page or in the architecture index. One concern per page. |
| A3 | Its Diátaxis type is clear: explanation pages don't contain step-by-step procedures, and how-to pages don't contain long explanations. Link between them instead. |
| A4 | Every factual claim (names, flows, rules, defaults, counts) is true at the current commit. The audit and the final verification record evidence for each one. |
| A5 | Every stated rule or guarantee links to the code or the automated check that enforces it. Unenforced rules are marked as conventions. |
| A6 | Built, partial and planned are clearly separated with status callouts. Nothing planned is described in the present tense. |
| A7 | Significant structures link to their ADR (R1–R9). |
| A8 | It links to the API reference and UI docs instead of duplicating them. There's no duplication between architecture pages either; each fact has one home. |
| A9 | Follows the writing standard (§4). |
| A10 | It's listed in `meta.json`, it's reachable from the architecture index, and its links resolve. |

### Diagram checklist (every diagram)

| ID | Requirement |
| --- | --- |
| D1 | It's a C4 view type (system context, container, component, deployment or dynamic), or a standard sequence, entity-relationship or data-flow diagram, and its title says which. |
| D2 | It's Mermaid source in the page, or generated by a script in the repo with a stale check. No binary images of diagrams. |
| D3 | Every element is a real thing with its code name: container, module, table, route or setting. No invented boxes. |
| D4 | It has a key or legend whenever shapes, colours or line styles carry meaning. Relationships are labelled with their verb and protocol ("calls over HTTPS/JSON", "reads/writes SQL"). |
| D5 | Its scope is stated in the caption: what it shows and what it leaves out. |
| D6 | It renders in light and dark themes and is readable at 360px (horizontal scroll inside the diagram is allowed; page overflow isn't). It has a text alternative: the caption, or a list summarising the relationships. |
| D7 | Planned elements are visually distinct (for example dashed) and labelled "planned". |

### ADR checklist (every decision record)

| ID | Requirement |
| --- | --- |
| R1 | Uses the MADR 4 template: title, status, date, deciders, context and problem, decision drivers, considered options, decision outcome, consequences (good, bad), confirmation, and more information. |
| R2 | Numbered sequentially (`0001-…`) with a kebab-case title that states the decision ("use FastAPI for the backend engine"). |
| R3 | The status is one of: proposed, accepted, deprecated, superseded by `NNNN`. Retroactive records for decisions already in the code say "accepted (recorded retroactively on <date>)". |
| R4 | The context and options are factual. **Never invent rationale.** If the original reasons aren't known from the code, commits or existing docs, say so ("the original rationale was not recorded") and give the trade-offs as they stand today. |
| R5 | "Confirmation" says how compliance is checked: a fitness function, a test or a review. |
| R6 | Records are immutable once accepted. A change means a new ADR that supersedes the old one; the old one is only updated to point forward. |
| R7 | It's linked from the architecture pages it affects (A7), and listed in the decision log index. |
| R8 | One decision per record. |
| R9 | Follows the writing standard (§4). |

### Fitness function checklist (every enforced architecture rule)

| ID | Requirement |
| --- | --- |
| F1 | Each rule stated in the docs as a rule (dependency directions, layering, plug-in contract, naming) has an automated check: `import-linter` contracts for Python, Nx `@nx/enforce-module-boundaries` tags for TypeScript, or a custom test. |
| F2 | The check runs in CI and fails the build on a violation. |
| F3 | The failure message names the rule and links to the docs page that explains it. |
| F4 | The docs page links back to the check (A5). |

## 6. Engineering rules

- **Documentation first, code second.** Change code only to add fitness functions, doc generators,
  checks or frontmatter schema, or to fix a real defect the docs uncover. Record each code change in
  `PROGRESS.md`.
- If the code contradicts an existing doc, the code is the truth for "what is". Whether the code
  *should* change is a decision: record it as a risk or technical-debt item (prompt 10), or as a
  proposed ADR. Don't silently "fix" the architecture.
- **Line endings**: files are mixed CRLF and LF. After editing, check `git diff --stat`, and restore
  the original endings on accidental whole-file rewrites.
- **MDX**: `{` and `<` in prose break the build. Use code spans. Mermaid blocks need the renderer
  from prompt 02.
- Work on the branch `docs/architecture`. Commit at the end of each prompt with a conventional
  message. Never push or rewrite history.

## 7. Definition of done (every prompt)

1. The tasks are done, or listed as open in `PROGRESS.md` and marked blocking or non-blocking.
2. These pass, run uncached:
   - `pnpm nx build landing`
   - the docs gates and fitness functions (from prompt 02)
   - the existing test targets for any project you changed
3. Changed pages were checked in the dev server (`pnpm nx dev landing`, under `/docs`), in light and
   dark themes, at desktop and 360px, with the diagrams rendered and no console errors. If you
   couldn't check, say so.
4. `git diff --stat` is clean of line-ending rewrites.
5. Your `PROGRESS.md` entry is appended, and you have committed.

Entry format:

```markdown
## NN – <title> – <date>
**Summary**:
**Changed**:
**Code changes** (fitness functions, generators, fixes): none | list
**Decisions**:
**Verification**:
**Open issues** (blocking / non-blocking, with IDs):
```
