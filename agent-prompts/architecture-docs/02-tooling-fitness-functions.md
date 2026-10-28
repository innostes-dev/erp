# 02 – Tooling, doc gates and fitness functions

## Role

You are the platform engineer for docs-as-code. Make diagrams render, make the docs checkable, and
make the architecture's stated rules enforced by CI.

## Read first

`STANDARDS.md` (§3, §5 D2, F1–F4), `PROGRESS.md`, `AUDIT.md` (the rule enforcement table and the
items owned by 02), `apps/landing/lib/source.ts`, `components/mdx.tsx`, the Fumadocs version, `nx.json`,
the ESLint config, `pyproject.toml` files, and `.github/workflows/ci.yml`. If the UI runbook's
`docs-check` exists, read it and extend it rather than duplicate it.

## Tasks

1. **Mermaid rendering** in the docs site:
   - client-side or build-time, themed with the site's tokens in light and dark mode
   - no layout overflow at 360px (scroll inside the diagram)
   - an accessible text alternative supported (a caption component)
   - Use the approach recommended for this Fumadocs version. Read its docs in `node_modules`. Add a
     `<Diagram caption="…">` wrapper and document it in `writing-docs.mdx`.
   - Mermaid supports C4 diagrams (`C4Context`, `C4Container`, …), but they're experimental. Test
     them. If their rendering is poor, standardise on `flowchart` with C4 notation conventions (a
     legend per D4), and record the decision.
2. **Diagram gate**: a check that compiles every Mermaid block in `content/dev-docs` (for example
   with `@mermaid-js/mermaid-cli`, or the Mermaid parser) and fails with the file and line on syntax
   errors.
3. **Frontmatter**: extend the dev-docs schema with `owner` (string) and `lastReviewed` (ISO date)
   for pages under `architecture/` and `operations/`. Add a check that fails when either is missing,
   or when `lastReviewed` is older than a configurable age (default 180 days; report-only by default).
   Show "Owner" and "Last reviewed" on the page.
4. **ADR gate**: a check that every file in `architecture/decisions/` matches the MADR structure
   (R1), the numbering (R2) and the allowed statuses (R3). It also checks that each `superseded by`
   points to an existing ADR, and that the index lists every ADR.
5. **Link and arc42-map gate**: extend or create the dev-docs link checker. Every architecture page
   must declare its arc42 section in frontmatter (`arc42: 5` or a list), and the checker verifies
   that all 12 sections are covered by at least one page (report mode until prompt 10).
6. **Fitness functions** (F1–F4):
   - **Python**: add `import-linter` contracts for the backend dependency rules in `overview.mdx`
     (the engine doesn't import plug-ins by name; plug-ins don't import the engine; the kernel imports
     no other plug-in; plug-ins don't import each other except through declared interfaces), plus
     the kernel layering found in the audit (for example `router → services → models`, with `core`
     importing no feature module). Run them in an Nx target (`arch-check`) and in CI.
   - **TypeScript**: add Nx project tags and `@nx/enforce-module-boundaries` rules mirroring the same
     rules for `apps/web-app`, `kernel/frontend` and `packages/*`.
   - Each contract's name and failure message reference the rule ID and the docs URL (F3).
   - If the code currently violates a rule, **don't loosen the rule**. Add a narrowly scoped,
     commented exception that names an `ARC-*` debt item. List it in `PROGRESS.md` for prompt 10.
7. **One target**: `pnpm nx run landing:arch-docs-check` runs gates 2–5. `arch-check` runs the
   fitness functions. Both are in CI and documented in `writing-docs.mdx` and a new
   `content/dev-docs/guides/architecture-docs.mdx` (how to write architecture pages and ADRs, with the
   checklists summarised).

## Definition of done

- Diagrams render in both themes.
- All gates and fitness functions exist, run in CI and are documented.
- The current violations are recorded as debt with narrow exceptions.
- Commit as `ci(docs): diagram rendering, architecture doc gates and fitness functions`.
- STANDARDS §7 is met.
