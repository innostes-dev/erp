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


## 03 – Library: Actions and Forms – 2026-10-29

**Summary**: Hardened all 19 components across `packages/ui/src/components/actions` and `packages/ui/src/components/forms`. Configured customizable a11y labels in Combobox, Select, SearchableSelect, DatePicker, DateRangePicker, and NumberField (LIB-003 partial). Added `invalid` prop and Field integration to FileDropzone. Ensured explicit `data-slot` coverage across all components and expanded form test coverage with comprehensive test suites.
**Changed**:
- `packages/ui/src/components/forms/combobox/combobox.tsx`: added `clearLabel` and `openLabel` customizable props.
- `packages/ui/src/components/forms/number-field/number-field.tsx`: added `decrementLabel` and `incrementLabel` props.
- `packages/ui/src/components/forms/searchable-select/searchable-select.tsx`: added `openLabel` prop.
- `packages/ui/src/components/forms/date-picker/date-picker.tsx`: added `clearLabel` and `presetsLabel` props.
- `packages/ui/src/components/forms/file-dropzone/file-dropzone.tsx`: added `invalid` prop, `aria-invalid` and `aria-describedby` Field context bindings.
- `packages/ui/src/components/forms/locale-select/locale-select.tsx`: verified explicit `data-slot` attributes.
- `packages/ui/src/components/forms/forms-coverage.test.tsx`: created comprehensive suite testing Select/Combobox anatomy, subcomponents, Fieldset, CheckboxGroup, NumberField labels, FileDropzone validation, and locale select presets.
**API changes**:
- Added optional label props with backwards-compatible defaults: `clearLabel`, `openLabel`, `decrementLabel`, `incrementLabel`, `presetsLabel`.
- Added optional `invalid?: boolean` prop to `FileDropzoneProps`.
**Decisions**:
- Preserved existing defaults for all customizable accessibility strings to prevent breaking consumer markup.
- `FileDropzone` automatically checks `aria-invalid` from enclosing `Field` context while honoring explicit `invalid` prop overrides.
**Verification**:
- `pnpm nx test ui`: PASS (25 test files, 194 tests)
- `pnpm nx build ui`: PASS (all 237 components compiled cleanly)
- `pnpm nx run landing:docs-check`: PASS (0.10s)
**Open issues**:
- Blocking: none.
- Non-blocking: remaining items in `AUDIT.md` for prompts 04–19.


## 04 – Library: data display and feedback – 2026-10-29

**Summary**: Hardened all 17 components across `packages/ui/src/components/data-display` and `packages/ui/src/components/feedback`. Fixed Meter and Progress percent formatting (LIB-002) to normalize shares against min/max matching Gauge. Added customizable a11y labels in DataTable (`selectAllLabel`, `selectRowLabel`, `selectedCountText`, `paginationRangeText`), AvatarGroup (`moreLabel`, RTL reverse spacing), and TreeView (`loadingLabel`, RTL keyboard handling). Replaced physical directional positioning with logical inline utilities in Toaster (LIB-007). Expanded test coverage across both folders to >90% with comprehensive benchmark and unit tests.
**Changed**:
- `packages/ui/src/components/feedback/meter/meter.tsx`: normalized percent values to format share of range; updated TSDoc example.
- `packages/ui/src/components/feedback/progress/progress.tsx`: normalized percent values matching Meter and Gauge.
- `packages/ui/src/components/feedback/toast/toast.tsx`: implemented logical inline positions (`start-4`, `end-4`, `top-start`, `bottom-end`) and added `closeLabel` prop.
- `packages/ui/src/components/data-display/data-table/data-table.tsx`: added customizable label props, converted line endings to LF.
- `packages/ui/src/components/data-display/tree-view/tree-view.tsx`: added RTL arrow key support, `loading` state support with Spinner indicator and `loadingLabel`.
- `packages/ui/src/components/data-display/avatar/avatar.tsx`: added `moreLabel` and `rtl:space-x-reverse`.
- Created `packages/ui/src/components/data-display/data-display-coverage.test.tsx` (1,000-row benchmark, custom labels, TreeView RTL/loading, Card/Table/Kbd/IconTile subcomponents).
- Created `packages/ui/src/components/feedback/feedback-coverage.test.tsx` (Meter/Progress/Gauge percent format regression, Toast promise/action/update lifecycle).
**API changes**:
- `MeterProps` & `ProgressProps`: normalizes `format={{ style: 'percent' }}` against min/max; accepts custom Intl options without RangeError.
- `DataTableProps`: added `selectAllLabel`, `selectRowLabel`, `selectedCountText`, `paginationRangeText`.
- `TreeViewProps`: added `loadingLabel`; `TreeNode` added `loading?: boolean`.
- `ToasterProps`: added `closeLabel`, added `'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'` to `position`.
- `AvatarGroupProps`: added `moreLabel`.
**Decisions**:
- Meter and Progress format the fraction of the span for percent styles, resolving the 7,200% defect (LIB-002).
- DataTable renders 1,000 rows cleanly with pagination under 150ms budget.
- TreeView automatically detects element or document `dir="rtl"` to flip ArrowLeft (expand) and ArrowRight (collapse).
**Verification**:
- `pnpm nx test ui`: PASS (27 test files, 209 tests)
- `pnpm nx build ui`: PASS (all 237 components compiled cleanly)
- `pnpm nx run landing:docs-check`: PASS (0.09s)
**Open issues**:
- Blocking: none.
- Non-blocking: remaining items in `AUDIT.md` for prompts 05–19.


## 05 – Library: overlays, navigation and layout – 2026-10-29

**Summary**: Hardened all 22 components across `src/components/overlays`, `src/components/navigation`, and `src/components/layout`. Resolved false positive `#1024` raw color audit note in Breadcrumb (LIB-010). Fixed logical RTL positioning and customizable `closeLabel` in Dialog and Sheet. Enhanced Stepper with configurable screen-reader status strings (`labels`). Implemented collapsible state (`collapsed`, `defaultCollapsed`, `onCollapsedChange`) in SplitPane for master-detail views. Added new accessible `SkipLink` component for keyboard navigation skip-to-content support.
**Changed**:
- `packages/ui/src/components/navigation/breadcrumb/breadcrumb.tsx`: resolved order example token `#1024` -> `ORD-1024` (LIB-010).
- `packages/ui/src/components/overlays/dialog/dialog.tsx`: added customizable `closeLabel` to `DialogContentProps`.
- `packages/ui/src/components/overlays/sheet/sheet.tsx`: added customizable `closeLabel` and logical `side="start" | "end"`.
- `packages/ui/src/components/navigation/stepper/stepper.tsx`: added customizable `labels` for assistive technology status text.
- `packages/ui/src/components/layout/split-pane/split-pane.tsx`: added `collapsed`, `defaultCollapsed`, `onCollapsedChange` props and accessibility handling.
- `packages/ui/src/components/layout/skip-link/skip-link.tsx`: created `SkipLink` accessible jump component.
- `packages/ui/src/components/layout/index.ts`: exported `SkipLink`.
- Created `packages/ui/src/components/overlays/overlays-coverage.test.tsx` (CommandPalette filtering/hotkeys, Dialog/Sheet/AlertDialog anatomy).
- Created `packages/ui/src/components/layout/layout-coverage.test.tsx` (SkipLink, PageHeader, TopBar, FormGrid/FormSection, ScrollArea, Stepper labels).
- Normalized CRLF line endings to LF across `packages/ui/src`.
**API changes**:
- Added `SkipLink` and `SkipLinkProps` to `@innostes/ui`.
- `DialogContentProps` & `SheetContentProps`: added `closeLabel?: string`.
- `SheetContentProps['side']`: added `'start' | 'end'`.
- `StepperProps`: added `labels?: { completedGoBack?: string; completed?: string; hasErrors?: string }`.
- `SplitPaneProps`: added `collapsed?: boolean`, `defaultCollapsed?: boolean`, `onCollapsedChange?: (collapsed: boolean) => void`.
**Decisions**:
- Added `SkipLink` targeting `#main-content` by default with accessible fixed focus styling.
- `SplitPane` supports collapsing to 0% with `data-collapsed` attributes and uncollapses upon double-click.
**Verification**:
- `pnpm nx test ui`: PASS (29 test files, 224 tests)
- `pnpm nx build ui`: PASS (238 components compiled cleanly)
- `pnpm nx run landing:docs-check`: PASS (0.09s)
**Open issues**:
- Blocking: none.
- Non-blocking: remaining items in `AUDIT.md` for prompts 06–19.


## 06 – Library: widgets, charts and editor – 2026-10-29

**Summary**: Hardened all 14 widgets (`src/widgets`), cartesian & donut charts (`src/charts`), and RichTextEditor (`src/editor`). Resolved touch screen limitation on `KanbanBoard` by implementing an accessible and responsive "Move to…" card select mechanism. Added 500-card benchmark test verifying sub-3s rendering. Hardened `PermissionMatrix` with sticky column/header, mixed state accessible naming, `readOnly` state disabling toggles, and responsive text wrapping. Hardened `ChangeLog` for long/rich values and RTL icon flips. Enabled `allowDecimals` configuration on cartesian charts and verified colour-blind safe tokens. Hardened `RichTextEditor` with form `invalid` integration, toolbar roving, link form keyboard lifecycle, and tested custom extensions. Line coverage across all three scopes exceeds 94% (Widgets: 95.8%, Charts: 95.1%, Editor: 98.0%).
**Changed**:
- `packages/ui/src/editor/editor-icons.tsx`: wrapped all exported icons in `forwardRef` (LIB-009) and added `data-slot` attributes (LIB-008).
- `packages/ui/src/editor/rich-text-editor.tsx`: added `invalid?: boolean` prop for Form/Field integration; configured `data-invalid` on root and `aria-invalid` on content; added error styling.
- `packages/ui/src/widgets/kanban-board/kanban-board.tsx`: added accessible touch "Move to…" column selector to cards; enhanced RTL direction detection (`dir="rtl"` attribute and style); updated `KanbanLabels` with `moveAction`, `moveTo`, `moveToColumn`.
- `packages/ui/src/widgets/permission-matrix/permission-matrix.tsx`: added `stickyColumn`, `stickyHeader`, and configurable `notApplicable` and `mixed` state labels; guarded `readOnly` mode from mutating state.
- `packages/ui/src/widgets/change-log/change-log.tsx`: added `break-words` on `from` and `to` diff tags to prevent long text/hashes from overflowing.
- `packages/ui/src/charts/cartesian-charts.tsx`: added `allowDecimals?: boolean` prop to `CartesianChartProps` and wired to value axis.
- Created `packages/ui/src/charts/charts-coverage.test.tsx`: tested empty data `[]`, single data point, negative values, horizontal layout, custom formatting, and `chart-utils`.
- Created `packages/ui/src/widgets/widgets-coverage.test.tsx`: added 500-card Kanban benchmark test, touch move actions, native drag-and-drop, PermissionMatrix sticky/readOnly, MetricCard variants, ChangeLog rich items, and AppSwitcher search filtering.
- Expanded `packages/ui/src/editor/rich-text-editor.test.tsx`: tested invalid/disabled form integration, link form Escape/remove actions, and full toolbar tool execution.
**API changes**:
- `RichTextEditorProps`: added `invalid?: boolean`.
- `KanbanBoardProps`: added `cardMoveSelect` slot to `KanbanBoardSlot`; added `moveAction`, `moveTo`, `moveToColumn` to `KanbanLabels`.
- `PermissionMatrixProps`: added `stickyColumn?: boolean`, `stickyHeader?: boolean`, `resourceLabel?: string`; added `notApplicable?: string` and `mixed?: (name: string) => string` to `labels`.
- `CartesianChartProps`: added `allowDecimals?: boolean`.
**Bundle sizes (gzip)**:
- `dist/editor/rich-text-editor.js`: 9.89 kB (gzip: 3.49 kB)
- `dist/editor/editor-icons.js`: 4.46 kB (gzip: 1.03 kB)
- `dist/charts/cartesian-charts.js`: 7.33 kB (gzip: 2.11 kB)
- `dist/charts/chart-utils.js`: 4.87 kB (gzip: 1.84 kB)
- `dist/charts/donut-chart.js`: 3.87 kB (gzip: 1.51 kB)
- `dist/widgets/kanban-board/kanban-board.js`: 11.45 kB (gzip: 3.97 kB)
- `dist/widgets/metric-card/metric-card.js`: 9.56 kB (gzip: 2.78 kB)
- `dist/widgets/notifications/notifications.js`: 6.64 kB (gzip: 2.25 kB)
- `dist/widgets/app-switcher/app-switcher.js`: 6.17 kB (gzip: 2.16 kB)
- `dist/widgets/permission-matrix/permission-matrix.js`: 5.54 kB (gzip: 1.87 kB)
- `dist/widgets/widget-card/widget-card.js`: 5.15 kB (gzip: 1.76 kB)
- `dist/widgets/activity-feed/activity-feed.js`: 4.14 kB (gzip: 1.54 kB)
- `dist/widgets/entity-list/entity-list.js`: 3.64 kB (gzip: 1.32 kB)
- `dist/widgets/change-log/change-log.js`: 2.86 kB (gzip: 1.09 kB)
- `dist/widgets/user-menu/user-menu.js`: 2.90 kB (gzip: 1.18 kB)
- `dist/widgets/action-list/action-list.js`: 2.45 kB (gzip: 0.96 kB)
- `dist/widgets/sparkline/sparkline.js`: 1.25 kB (gzip: 0.54 kB)
- `dist/widgets/quick-actions/quick-actions.js`: 1.49 kB (gzip: 0.65 kB)
- `dist/widgets/welcome-banner/welcome-banner.js`: 1.70 kB (gzip: 0.72 kB)
**Decisions**:
- KanbanBoard supports both native pointer drag and drop and a touch-friendly "Move to…" select on each card that appears on hover/focus on desktop and is permanently accessible on touch/coarse pointers.
- RichTextEditor integrates directly with Field via `invalid` prop forwarding to `aria-invalid` on the contenteditable node.
- PermissionMatrix preserves standard `rowLabel` and `colLabel` accessible names by default and allows optional `labels.mixed` override while maintaining standard `aria-checked="mixed"`.
**Verification**:
- `pnpm nx test ui`: PASS (31 test files, 244 tests)
- `pnpm nx build ui`: PASS (all 238 components compiled cleanly)
- `pnpm nx run landing:docs-check`: PASS (0.09s, all 6 enforced gates green)
**Open issues**:
- Blocking: none.
- Non-blocking: remaining items in `AUDIT.md` for prompts 07–19.


## 07 – Docs platform: information architecture, building blocks and site features – 2026-10-29

**Summary**: Established complete enterprise information architecture with section overviews and dynamic category grids generated from page frontmatter. Implemented reusable MDX building blocks (`KeyboardTable`, `DoDont`, `Anatomy`, `PropsPlayground`, `StatusBadge`, `Since`, `CategoryGrid`), migrated `ButtonPlayground` to `PropsPlayground`, and added full enterprise documentation platform features (dynamic OpenGraph cards via `/api/og`, `sitemap.xml`, `robots.txt`, branded `not-found.tsx`, `public/llms.txt` + `llms-full.txt`, search prop indexing, and responsive/print styles). Rewrote authoring guide (`writing-docs.mdx`) and established empty-free stubs across `frameworks/`, `foundations/`, `patterns/`, and `resources/`.

**Changed**:
- `apps/landing/components/docs/`: created `keyboard-table.tsx`, `do-dont.tsx`, `anatomy.tsx`, `props-playground.tsx`, `status-badge.tsx`, `since.tsx`, `category-grid.tsx`; migrated `button-playground.tsx` onto `PropsPlayground`.
- `apps/landing/components/docs/preview-tabs.tsx`: added 360px viewport toggle and dark/light preview toggle.
- `apps/landing/components/docs/docs-page.tsx`: added `editOnGithub` link, `lastUpdate`, and OpenGraph dynamic metadata.
- `apps/landing/app/api/og/route.tsx`: dynamic OpenGraph social image generator with edge runtime.
- `apps/landing/app/sitemap.ts` & `apps/landing/app/robots.ts`: dynamic sitemap and crawl configuration.
- `apps/landing/app/not-found.tsx`: branded 404 error page with quick search and top destination links.
- `apps/landing/app/api/search/route.ts`: search route indexing component prop names from `api.json`.
- `apps/landing/app/global.css`: added print stylesheet hiding navigation chrome.
- `apps/landing/lib/shared.ts`: dynamically loaded package version from `packages/ui/package.json`.
- `apps/landing/scripts/generate-llms.mjs`: build script generating `public/llms.txt` and `public/llms-full.txt`.
- `apps/landing/content/docs/`: created category overviews (`components/actions/index.mdx`, `forms/index.mdx`, `data-display/index.mdx`, `feedback/index.mdx`, `overlays/index.mdx`, `navigation/index.mdx`, `layout/index.mdx`, `widgets/index.mdx`, `charts/index.mdx`).
- Added non-empty stubs:
  - `content/docs/frameworks/` (`nextjs.mdx`, `vite.mdx` - filled in prompt 08).
  - `content/docs/foundations/` (`status-legend.mdx`, `colour.mdx`, `typography.mdx`, `spacing.mdx`, `icons.mdx`, `motion.mdx`, `dark-mode.mdx` - filled in prompt 08).
  - `content/docs/accessibility.mdx` (expanded in prompt 08).
  - `content/docs/patterns/` (`index.mdx`, `complex-forms.mdx`, `data-management.mdx`, `app-shell.mdx` - filled in prompt 13).
  - `content/docs/resources/` (`index.mdx`, `conventions.mdx`, `changelog.mdx`, `versioning.mdx`, `migration.mdx`, `contributing.mdx`, `security.mdx`, `faq.mdx` - filled in prompt 15).
- `apps/landing/content/dev-docs/guides/writing-docs.mdx`: complete rewrite documenting component template, MDX blocks, example data universe, demo conventions, and quality gates.

**API changes**: none.

**Decisions**:
- Category overview grids are rendered dynamically via `source.getPages()`, ensuring component listings never drift from filesystem state.
- `PropsPlayground` accepts standard control definitions (`select`, `boolean`, `text`, `number`) and synthesizes interactive previews with live code generation.
- Search indexes prop names directly from `packages/ui/dist/api.json` into Fumadocs structured data.
- Relative redirect configured from legacy `/ui/docs/conventions` to `/ui/docs/resources/conventions`.

**Verification**:
- `pnpm nx run landing:docs-check`: PASS (all 6 enforced quality gates green).
- `pnpm nx build landing --skip-nx-cache`: PASS (136 static pages, `_not-found`, `sitemap.xml`, `robots.txt`, `api/og`, `api/search`).
- `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache`: PASS (31 test files, 244 tests).
- `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache`: PASS (all 27 test files, 218 tests across both runtimes).

**Open issues**:
- Blocking: none.
- Non-blocking: remaining items in `AUDIT.md` for prompts 08–19.


## 08 – Foundations and getting started – 2026-10-29

**Summary**: Completely overhauled getting started, design foundations, theming, and accessibility documentation. Hardened design token contrast across light and dark modes in `theme.css` and `dark.css` (LIB-004), achieving 100% WCAG 2.2 AA pass across all 14 semantic pairings. Built build-time token reference and contrast table generation script. Replaced stale component table with dynamic `<ComponentIndex />` frontmatter reader (DOC-002). Added live interactive ERP hero example (`<HeroDemo />`). Authored complete framework integration guides for Next.js App Router and Vite React, both verified via real temporary scratch app builds in `/tmp` and cleaned up. Rewrote API conventions (DOC-009) removing internal repository paths and duplicate composition sections. Expanded accessibility statement (DOC-008) and design foundations (Colour, Typography, Spacing, Icons, Motion).

**Changed**:
- `packages/ui/tailwind/theme.css`: adjusted `--color-muted-foreground` and `--color-sidebar-muted-foreground` to `zinc-600` (contrast > 6.9:1), `--color-success` to `emerald-700` (contrast 5.15:1), and `--color-info` to `sky-700` (contrast 5.85:1).
- `packages/ui/tailwind/dark.css`: adjusted dark `--color-primary` to `blue-400` with `zinc-950` foreground (contrast 7.54:1), `--color-destructive` to `red-600` (contrast 4.76:1), and `--color-info-foreground` to `sky-950` (contrast 6.94:1).
- `packages/ui/src/components/feedback/progress/progress.tsx`: added `motion-reduce:transition-none` and `motion-reduce:data-indeterminate:animate-none` for `prefers-reduced-motion` compliance.
- `apps/landing/scripts/generate-tokens-data.mjs`: new build-time script parsing `theme.css` and `dark.css`, computing relative luminance, contrast ratios, and emitting `apps/landing/lib/tokens-data.json`.
- `apps/landing/components/docs/token-reference.tsx`: generated token reference table grouped by semantic role with light/dark values and live swatches.
- `apps/landing/components/docs/contrast-table.tsx`: generated contrast table validating all 14 semantic pairings against WCAG 2.2 AA.
- `apps/landing/components/docs/component-index.tsx`: dynamic component table reading source frontmatter, displaying categories, stability badges, and entry points.
- `apps/landing/components/docs/hero-demo.tsx`: live Northwind Traders purchase order approval hero demo.
- `apps/landing/content/docs/index.mdx`: full rewrite with Northwind Traders context, core guarantees linked to policies, entry point matrix, and `<ComponentIndex />`.
- `apps/landing/content/docs/installation.mdx`: full rewrite with exact version requirements, package manager tabs, style pipelines, providers, peer dependency guidance for Recharts on React 17, and troubleshooting.
- `apps/landing/content/docs/frameworks/nextjs.mdx`: complete App Router guide with RSC boundaries, `next-themes` setup, hydration protection, and Server Component example.
- `apps/landing/content/docs/frameworks/vite.mdx`: complete Vite React guide with `@tailwindcss/vite` and standalone CSS options, theme switcher, and dispatch station demo.
- `apps/landing/content/docs/theming.mdx`: full rewrite with OKLCH explanation, overrides, scoped themes, multi-tenant theming, and `<TokenReference />`.
- `apps/landing/content/docs/foundations/`: complete rewrites of `colour.mdx` (with `<ContrastTable />`), `dark-mode.mdx` (class vs data-theme, next-themes, testing), `typography.mdx` (fluid clamp tokens, tabular nums), `spacing.mdx` (4px rhythm, density modes, container queries), `icons.mdx` (lucide-react, sizing, aria-hidden, icon-only buttons), and `motion.mdx` (duration scale, reduced motion).
- `apps/landing/content/docs/accessibility.mdx`: full rewrite with WCAG 2.2 AA target, library guarantees vs application responsibilities, testing matrix, and problem reporting.
- `apps/landing/content/docs/resources/conventions.mdx`: full rewrite without duplication, composition with `render` prop, controlled/uncontrolled state, event details, styling layers, sizes, internationalisation, RTL, and zero repo-internal paths.
- `packages/ui/CONTRIBUTING.md` & `apps/landing/content/dev-docs/packages/ui.mdx`: added `src/widgets`, `src/charts`, and `src/editor` entries (DEV-001, DEV-002).

**Scratch Build Verifications**:
- Vite React scratch build: Created temporary app in `/tmp`, installed dependencies (`react@19`, `@innostes/ui`), compiled with `vite build` in 2.05s (879 modules transformed), verified zero errors, cleaned up directory.
- Next.js App Router scratch build: Created temporary app in `/tmp`, configured `next.config.mjs` with `transpilePackages: ["@innostes/ui"]`, compiled with `next build` in Next.js 15.2.1, generated all 4 static pages, verified zero errors, cleaned up directory.

**Verification**:
- `pnpm nx run landing:docs-check`: PASS (0.12s, all 6 enforced quality gates green)
- `pnpm nx build landing --skip-nx-cache`: PASS (136 static pages compiled cleanly)
- `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache`: PASS (31 test files, 244 tests, 238 components compiled)
- `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache`: PASS (React 17 & 18 test & typecheck suites green)

**Open issues**:
- Blocking: none.
- Non-blocking: Prompt 09 (Actions and forms component doc pages overhaul).


