# Progress log

Each agent appends one entry, in the format defined in `STANDARDS.md` §8. Newest entries go at the
bottom. Don't edit earlier entries, except to mark an open issue as resolved: add
"Resolved in NN (commit)".

## 00 – Seed notes from the initial review – 2026-10-28

**Summary**: Notes from a manual review before the runbook started. Prompt 01 must verify each one and
turn it into an `AUDIT.md` item.

**Known defects**:

- `content/docs/examples/dashboard.mdx` has 13 broken links. They use the `/docs/...` base, which is
  the developer docs, and point to pages that don't exist.
- Widgets with no docs page: `ActivityFeed`, `EntityList`, `QuickActions`, `WelcomeBanner` and
  `ActionList`. `Notifications` is documented as `notification-bell`. Check the naming.
- The component table on `content/docs/index.mdx` is stale. It's missing the widgets, the charts and
  the components added on 2026-10-28.
- `conventions.mdx`:
  - The list of components with `classNames` is stale.
  - The `render` prop is explained twice.
  - Customisation and Styling overlap.
  - It refers to an internal repo path (`packages/ui/tailwind/theme.css`).
  - It promises a changelog with migration notes, and none exists.
- The `Meter` TSDoc and docs example `value={72} format={{ style: 'percent' }}` renders "7,200%".
- `charts/*.mdx` don't follow the page template: no `icon`, `status` or `summary`, and a different
  tone ("**Important Version Guidance:**").
- The site shows `v0.0.1` while `conventions.mdx` promises semantic-versioning guarantees.
- Only 46 of 78 pages have an Accessibility section. Most component pages are 20–45 lines. Only Button
  has a props playground.
- Spelling is mixed (colour/color, customise/Customization, behaviour/behavior).
- Heading case is mixed (Title Case and sentence case).
- There is no changelog, migration guide, deprecation policy, support matrix (React versions,
  browsers), accessibility statement, security page, or patterns or guides section.
- The tokens table on `theming.mdx` is hand-written. It doesn't show dark values and can drift from
  `tailwind/theme.css`.
- There's no "Edit this page" link, no "Last updated", no `llms.txt`, and no status legend.

**Added on 2026-10-28 (Beta, not yet checked in a browser)**: `TagInput`, `FileDropzone`,
`TreeView`, `SplitPane`, `Gauge`, `KanbanBoard`, `PermissionMatrix`, `ChangeLog`, and `RichTextEditor`
(in `@innostes/ui/editor`). Known limit: `KanbanBoard`'s mouse dragging uses native HTML drag and
drop, which doesn't work on touch screens.


## 01 – Audit – 2026-10-28

**Summary**: Completed comprehensive enterprise readiness audit of `@innostes/ui` and the documentation site. Established baseline test and build metrics across React 17, 18, and 19 suites. Catalogued 37 discrete findings categorized across Library, Documentation, Platform, and Developer Docs, and compiled the full 258-symbol coverage matrix in `AUDIT.md`.
**Changed**:
- Created `agent-prompts/ui-docs-overhaul/AUDIT.md` (baseline, defect summary, findings table, and 258-symbol coverage matrix).
- Appended audit entry to `agent-prompts/ui-docs-overhaul/PROGRESS.md`.
**API changes**: none.
**Decisions**:
- All findings are prioritized and mapped to owner prompts 02–15 for sequential resolution.
- Contrast validation must be automated in prompt 02 against WCAG 2.2 AA thresholds.
- All React 18+ hooks (`useId`, `useSyncExternalStore`) in library code must be eliminated to maintain genuine React 17 compatibility.
**Verification**:
- `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache`: PASS (19.1s)
- `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache`: PASS (31.0s)
- `pnpm nx build landing --skip-nx-cache`: PASS (28.0s, 104 static pages generated)
- Automated scratch scripts verified 13 broken links, 9 React 18+ API violations, 54 hardcoded strings, and token contrast failures across both themes.
**Open issues**:
- Blocking: none for prompt 01 (findings are inputs for downstream prompts 02–19).
- Non-blocking: 37 catalogued findings in `AUDIT.md` (`LIB-001` through `DEV-003`).


## 02 – Quality gates – 2026-10-29

**Summary**: Implemented deterministic documentation quality gates under `apps/landing/scripts/checks/` and configured the Nx target `landing:docs-check` wired into CI. All 6 enforced gates pass cleanly with zero errors. Fixed mechanical defects in dashboard links (DOC-001), tag-input MDX curly braces, and change-log Lucide icon (DOC-016).
**Changed**:
- Created `apps/landing/scripts/checks/` (`check-links.mjs`, `check-demos.mjs`, `check-sidebar.mjs`, `check-mdx-safety.mjs`, `check-consistency.mjs`, `check-prose.mjs`, `check-frontmatter.mjs`, `check-coverage.mjs`, `check-api-tables.mjs`, `check-template.mjs`, `run-all.mjs`, `docs-coverage-allowlist.json`, `README.md`).
- Added `docs-check` target to `apps/landing/package.json`.
- Added `docs-check` to `.github/workflows/ci.yml`.
- Documented quality gates in `apps/landing/content/dev-docs/guides/writing-docs.mdx`.
- Fixed 13 broken links in `apps/landing/content/docs/examples/dashboard.mdx` (DOC-001).
- Fixed unescaped curly braces in `apps/landing/content/docs/components/forms/tag-input.mdx`.
- Fixed unrecognized Lucide icon in `apps/landing/content/docs/widgets/change-log.mdx` (DOC-016).
**API changes**: none.
**Decisions**:
- Enforced gates must exit non-zero on any violation in local runs and CI.
- Report-mode gates output quantitative defect counts and will be flipped to enforce in prompts 12 and 17.
**Verification**:
- `pnpm nx run landing:docs-check`: PASS (0.09s)
- `pnpm nx build landing --skip-nx-cache`: PASS (30s)
- Report-mode counts recorded to drive to zero:
  - Incomplete frontmatter: 8
  - Exported symbols lacking ApiTable/allowlist: 80
  - ApiTable entries with 0 props: 69
  - Template structure & casing defects: 369
  - American spelling occurrences: 21
**Open issues**:
- Blocking: none.
- Non-blocking: AUDIT items mapped to prompts 03–19.
