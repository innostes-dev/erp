# Audit – 2026-10-28

## Baseline

Baseline verification was executed on branch `docs/enterprise-overhaul` using `--skip-nx-cache`:

| Command | Status | Duration | Notes |
| :--- | :--- | :--- | :--- |
| `pnpm nx run-many -t test typecheck build -p ui --skip-nx-cache` | **PASS** | 19.1s | 3 tasks passed (ui:test, ui:typecheck, ui:build). `api.json` generated with 237 components. |
| `pnpm nx run-many -t test typecheck -p ui-react17-tests ui-react18-tests --skip-nx-cache` | **PASS** | 31.0s | 5 tasks passed (ui:build, ui-react17-tests:test/typecheck, ui-react18-tests:test/typecheck). |
| `pnpm nx build landing --skip-nx-cache` | **PASS (with warnings)** | 28.0s | 83 demos compiled, 104 static pages generated. Warning: `[lucide-icons-plugin] Unknown icon detected: History.` |
| `pnpm nx run landing:docs-check` | **N/A** | – | Target does not exist yet (scope of Prompt 02). |

---

## Summary

### Defect Counts by Area and Severity

| Area | S1 (Broken/Wrong) | S2 (Missing) | S3 (Inconsistency/Polish) | Total |
| :--- | :--- | :--- | :--- | :--- |
| **LIB** (Library) | 5 | 4 | 2 | **11** |
| **DOC** (Documentation) | 6 | 6 | 4 | **16** |
| **PLAT** (Platform) | 0 | 6 | 1 | **7** |
| **DEV** (Dev Docs) | 2 | 1 | 0 | **3** |
| **Total** | **13** | **17** | **7** | **37** |

### The Five Most Damaging Problems for an Enterprise Evaluator

1. **Hidden React 17/18 Incompatibilities (LIB-001)**: The documentation asserts full React 17/18 compatibility, but 9 files directly import React 18+ only hooks (`useId` in `RichTextEditor`, `CommandPalette`, `SplitPane`, `Calendar`, `FileDropzone`, `KanbanBoard`, `WidgetCard`, `CartesianCharts`; and `useSyncExternalStore` in `useMediaQuery`). Any enterprise consuming these components on React 17 crashes at runtime.
2. **Broken Internal Documentation Links (DOC-001)**: `content/docs/examples/dashboard.mdx` has 13 completely dead links pointing to `/docs/...` instead of `/ui/docs/...`, resulting in immediate 404s when following architectural example screens.
3. **Severe WCAG 2.2 AA Contrast Failures (LIB-004)**: Calculated color contrast fails WCAG 2.2 AA requirements for critical tokens: dark theme `info` on `info-foreground` sits at a failing **2.71:1** (< 3:1), dark `primary` on `primary-foreground` is **3.76:1** (< 4.5:1), and light `muted` text fails AA normal text (4.40:1).
4. **Hardcoded English Strings in Reusable Library Components (LIB-003)**: Core admin components have non-overridable, hardcoded English strings (e.g. `DataTable` hardcoding `aria-label="Invoices"`, `TreeView` with `"Departments"`, `Combobox` with `"Search fruit…"`, `KanbanBoard` with `"Hiring pipeline"`). This immediately disqualifies the library from multi-tenant or multi-language enterprise adoption.
5. **Significant Component Documentation Blackout (DOC-003, DOC-002)**: Five core ERP widgets (`ActivityFeed`, `EntityList`, `QuickActions`, `WelcomeBanner`, `ActionList`) have zero documentation pages. The main documentation introduction table is completely stale, omitting all widgets, charts, and new beta components.

---

## Findings

| ID | Severity | Area | Location | Finding | Fix | Owner prompt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LIB-001` | S1 | Library | `packages/ui/src/editor/rich-text-editor.tsx`, `packages/ui/src/components/overlays/command-palette/command-palette.tsx`, `packages/ui/src/components/layout/split-pane/split-pane.tsx`, `packages/ui/src/components/forms/calendar/calendar.tsx`, `packages/ui/src/components/forms/file-dropzone/file-dropzone.tsx`, `packages/ui/src/widgets/kanban-board/kanban-board.tsx`, `packages/ui/src/widgets/widget-card/widget-card.tsx`, `packages/ui/src/charts/cartesian-charts.tsx`, `packages/ui/src/lib/use-media-query.ts` | 9 library files import React 18+ only APIs (`useId`, `useSyncExternalStore`), causing runtime crashes on React 17. | Replace `useId` with `src/lib/use-id.ts` and replace `useSyncExternalStore` with React 17 compatible listener pattern. | 03, 04, 05, 06 |
| `LIB-002` | S1 | Library | `packages/ui/src/components/feedback/meter/meter.tsx:35` | Base UI `format` prop applies to raw value; example `value={72} format={{ style: 'percent' }}` outputs "7,200%". | Adjust `Meter` to normalize percent values or document decimal values `0.72` alongside clear TSDoc example. | 04 |
| `LIB-003` | S1 | Library | `packages/ui/src/components/data-display/data-table/data-table.tsx`, `packages/ui/src/components/forms/combobox/combobox.tsx`, `packages/ui/src/components/data-display/tree-view/tree-view.tsx`, `packages/ui/src/widgets/kanban-board/kanban-board.tsx`, `packages/ui/src/widgets/permission-matrix/permission-matrix.tsx`, `packages/ui/src/charts/cartesian-charts.tsx`, `packages/ui/src/charts/donut-chart.tsx` | Components hardcode domain-specific English accessibility labels (`"Invoices"`, `"Departments"`, `"Search fruit…"`, `"Hiring pipeline"`). | Remove hardcoded strings; make `aria-label` required or provide generic fallback overridable via `labels` prop. | 03, 04, 05, 06 |
| `LIB-004` | S1 | Library | `packages/ui/tailwind/theme.css`, `packages/ui/tailwind/dark.css` | Token contrast fails WCAG 2.2 AA: Dark `info` vs `info-foreground` is 2.71:1 (< 3:1); Dark `primary` is 3.76:1 (< 4.5:1); Light `muted` text is 4.40:1 (< 4.5:1). | Adjust OKLCH lightness values for dark theme `info` and `primary`, and increase contrast for `muted-foreground`. | 08 |
| `LIB-005` | S2 | Library | `packages/ui/src/widgets/*.tsx`, `packages/ui/src/charts/*.tsx`, `packages/ui/src/components/forms/*.tsx` | Multiple components rely solely on monolithic category test files rather than dedicated `[name].test.tsx` colocated tests matching `CONTRIBUTING.md`. | Split grouped tests into dedicated `[name].test.tsx` test files colocated with each component. | 03, 04, 05, 06 |
| `LIB-006` | S2 | Library | `packages/ui/package.json` | Missing package metadata (`repository`, `homepage`, `bugs`, `author`) and missing `LICENSE` file in package directory. | Populate package repository and bug URLs in `package.json`, and add `LICENSE` file. | 15 |
| `LIB-007` | S1 | Library | `packages/ui/src/components/feedback/toast/toast.tsx`, `packages/ui/src/components/overlays/dialog/dialog.tsx`, `packages/ui/src/components/overlays/alert-dialog/alert-dialog.tsx` | Physical directional classes (`left-4`, `right-4`, `left-1/2`) used instead of logical CSS (`inset-inline-start`, `inset-inline-end`), breaking RTL rendering. | Replace physical classes with logical inline utilities. | 04, 05 |
| `LIB-008` | S2 | Library | `packages/ui/src/editor/editor-icons.tsx`, `packages/ui/src/components/forms/locale-select/locale-select.tsx`, `packages/ui/src/charts/cartesian-charts.tsx` | Components lack required `data-slot` attributes on root and sub-elements. | Add `data-slot` attributes to all rendered elements. | 03, 06 |
| `LIB-009` | S2 | Library | `packages/ui/src/editor/editor-icons.tsx` | Exported icons in `editor-icons.tsx` do not use `forwardRef`. | Wrap exported SVG icon components with `forwardRef`. | 06 |
| `LIB-010` | S3 | Library | `packages/ui/src/components/navigation/breadcrumb/breadcrumb.tsx:42` | Raw hardcoded color `#1024` used instead of design token. | Replace with semantic border or text token. | 05 |
| `LIB-011` | S3 | Library | `packages/ui/package.json` | Version is listed as `0.0.1` despite conventions asserting semantic versioning guarantees. | Align version metadata and release policy. | 15 |
| `DOC-001` | S1 | Docs Content | `apps/landing/content/docs/examples/dashboard.mdx` | 13 broken internal links pointing to developer docs (`/docs/...`) instead of UI docs (`/ui/docs/...`). | Fix all links to point to valid `/ui/docs/...` component and widget pages. | 14 |
| `DOC-002` | S1 | Docs Content | `apps/landing/content/docs/index.mdx` | Component table is stale; missing widgets, charts, and all beta components added recently. | Rebuild table with all categories, widgets, charts, and current stability badges. | 08 |
| `DOC-003` | S2 | Docs Content | `apps/landing/content/docs/widgets/` | Five exported widgets have no documentation page: `ActivityFeed`, `EntityList`, `QuickActions`, `WelcomeBanner`, `ActionList`. | Create complete `.mdx` pages with demos and API tables for all five widgets. | 12 |
| `DOC-004` | S3 | Docs Content | `apps/landing/content/docs/widgets/notification-bell.mdx` | Component is named `Notifications` in code exports but documented as `notification-bell.mdx`. | Rename page and route to `notifications.mdx` to match component symbol. | 12 |
| `DOC-005` | S1 | Docs Content | `apps/landing/content/docs/conventions.mdx:26` | Refers to internal repository path `packages/ui/tailwind/theme.css` in public docs. | Change to public package import `@innostes/ui/theme.css`. | 08 |
| `DOC-006` | S1 | Docs Content | `apps/landing/content/docs/conventions.mdx` | Redundant content: `render` prop explained twice (lines 86-95 and 144-154); Customisation and Styling sections overlap. | Deduplicate sections and merge into cohesive guide. | 08 |
| `DOC-007` | S2 | Docs Content | `apps/landing/content/docs/conventions.mdx:181` | Promises a changelog with migration notes for breaking changes, but no changelog exists. | Create `CHANGELOG.md` and public `/ui/docs/changelog` page. | 15 |
| `DOC-008` | S1 | Docs Content | `apps/landing/content/docs/**/*.mdx` | 90 headings across UI component pages use Title Case (`API Reference`, `With Icons`, `Loading State`) violating sentence case standard. | Convert all headings to sentence case (`API reference`, `With icons`, `Loading state`). | 09, 10, 11, 12, 17 |
| `DOC-009` | S1 | Docs Content | `apps/landing/content/docs/**/*.mdx` | Inconsistent spelling mixing American and British English (`color`/`colour`, `Customization`/`customisation`). | Standardize all prose on British English while preserving code identifiers. | 17 |
| `DOC-010` | S1 | Docs Content | `apps/landing/content/docs/charts/*.mdx` | Chart pages do not follow component page template: missing `icon`, `status`, `summary` frontmatter, missing `## When to use`, `## Guidelines`, and uses alarmist warning banner. | Rewrite chart pages to follow standard component page template. | 12 |
| `DOC-011` | S2 | Docs Content | `apps/landing/content/docs/components/**/*.mdx` | 32 component pages lack an `## Accessibility` section with keyboard navigation tables and ARIA roles. | Add comprehensive `## Accessibility` sections with keyboard tables. | 09, 10, 11, 12 |
| `DOC-012` | S2 | Docs Content | `apps/landing/content/docs/components/**/*.mdx` | Component pages lack actionable `## Guidelines` (Do / Don't recommendations). | Add practical Do/Don't guidance to all component pages. | 09, 10, 11, 12 |
| `DOC-013` | S2 | Docs Content | `apps/landing/content/docs/patterns/` | Missing task-oriented guides for common ERP screens (e.g. Complex Forms, Data Table filtering/sorting, App Shell layout). | Create `/ui/docs/patterns` section with end-to-end implementation guides. | 13 |
| `DOC-014` | S2 | Docs Content | `apps/landing/content/docs/examples/` | Only one dashboard example exists; missing full reference screens (Order Details, Invoicing, Settings). | Add complete, production-grade example screens. | 14 |
| `DOC-015` | S2 | Docs Content | `apps/landing/content/docs/` | Missing enterprise governance pages: Support Matrix (browsers, React versions), Accessibility Statement, Deprecation Policy, Security. | Add governance and release policy pages under getting started / foundations. | 08, 15 |
| `DOC-016` | S1 | Docs Content | `apps/landing/content/docs/widgets/change-log.mdx:4` | Uses unrecognized icon `icon: History`, generating Turbopack build warning. | Replace with valid Lucide icon name (e.g. `Clock` or `FileText`). | 12 |
| `PLAT-001` | S2 | Docs Platform | `apps/landing/project.json`, `scripts/` | Missing automated quality gate command `pnpm nx run landing:docs-check` to validate links, MDX syntax, banned words, and demo registry in CI. | Implement `landing:docs-check` script and configure Nx target. | 02 |
| `PLAT-002` | S2 | Docs Platform | `apps/landing/app/`, `apps/landing/public/` | Missing SEO and LLM discovery files: no `sitemap.ts`, no `robots.ts`, and no `public/llms.txt`. | Add automated sitemap generator, robots.txt handler, and curated `llms.txt`. | 07 |
| `PLAT-003` | S2 | Docs Platform | `apps/landing/app/not-found.tsx` | Missing branded 404 error page. | Create branded 404 page with navigation links back to UI docs. | 07 |
| `PLAT-004` | S2 | Docs Platform | `apps/landing/components/docs/docs-page.tsx` | Page metadata lacks OpenGraph images, Twitter cards, and canonical URL tags. | Implement complete OpenGraph and canonical URL generation in `docsPageMetadata`. | 07 |
| `PLAT-005` | S2 | Docs Platform | `apps/landing/components/docs/docs-page.tsx` | Missing mature docs platform features: "Edit this page on GitHub", "Last updated", and feedback component. | Enable `editOnGithub`, `lastUpdate`, and add feedback collector in Fumadocs layout. | 07 |
| `PLAT-006` | S2 | Docs Platform | `apps/landing/content/docs/` | Missing status legend explaining `Stable`, `Beta`, and `Experimental` criteria. | Document component lifecycle and stability definitions on public docs page. | 08 |
| `PLAT-007` | S3 | Docs Platform | `apps/landing/components/layout/header.tsx` | Hardcoded `v0.0.1` label in documentation navigation header. | Dynamically load package version or display clear stability indicator. | 07 |
| `DEV-001` | S1 | Dev Docs | `apps/landing/content/dev-docs/packages/ui.mdx:30` | Directory structure diagram omits `src/charts` and `src/editor` entry points. | Update `<Files>` structure to include charts and editor directories. | 08 |
| `DEV-002` | S1 | Dev Docs | `packages/ui/CONTRIBUTING.md:16` | Contributing guide folder structure diagram omits `src/charts` and `src/editor`. | Update tree diagram to reflect all active source folders. | 08 |
| `DEV-003` | S2 | Dev Docs | `apps/landing/content/dev-docs/guides/releasing.mdx` | Release guide does not document publishing multiple entry points (`@innostes/ui/charts`, `@innostes/ui/editor`). | Add multi-entry release instructions and peer dependency guidance. | 15 |

---

## Coverage matrix

The following matrix documents all 258 exported symbols from `@innostes/ui`, `@innostes/ui/charts`, and `@innostes/ui/editor`:

| Symbol | Category | Source Location | Docs Page | Demo | In api.json | Tests | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Accordion` | components/navigation | `components/navigation/accordion/accordion.tsx` | `components/navigation/accordion.mdx` | `navigation/accordion/basic.tsx` | YES | YES | Stable |
| `AccordionItem` | components/navigation | `components/navigation/accordion/accordion.tsx` | `components/navigation/accordion.mdx` | `navigation/accordion/basic.tsx` | YES | YES | Stable |
| `AccordionPanel` | components/navigation | `components/navigation/accordion/accordion.tsx` | `components/navigation/accordion.mdx` | `navigation/accordion/basic.tsx` | YES | YES | Stable |
| `AccordionTrigger` | components/navigation | `components/navigation/accordion/accordion.tsx` | `components/navigation/accordion.mdx` | `navigation/accordion/basic.tsx` | YES | YES | Stable |
| `ActionList` | widgets | `widgets/action-list/action-list.tsx` | `MISSING` | `MISSING` | YES | YES | Unknown |
| `ActivityFeed` | widgets | `widgets/activity-feed/activity-feed.tsx` | `widgets/change-log.mdx` | `examples/dashboard.tsx` | YES | YES | Beta |
| `Alert` | components/feedback | `components/feedback/alert/alert.tsx` | `components/overlays/alert-dialog.mdx` | `examples/setup-wizard.tsx` | YES | YES | Stable |
| `AlertDescription` | components/feedback | `components/feedback/alert/alert.tsx` | `components/feedback/alert.mdx` | `examples/setup-wizard.tsx` | YES | YES | Stable |
| `AlertDialog` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertDialogClose` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertDialogContent` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertDialogDescription` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertDialogFooter` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | NO | Stable |
| `AlertDialogHeader` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | NO | Stable |
| `AlertDialogTitle` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertDialogTrigger` | components/overlays | `components/overlays/alert-dialog/alert-dialog.tsx` | `components/overlays/alert-dialog.mdx` | `overlays/alert-dialog/basic.tsx` | YES | YES | Stable |
| `AlertTitle` | components/feedback | `components/feedback/alert/alert.tsx` | `components/feedback/alert.mdx` | `examples/setup-wizard.tsx` | YES | YES | Stable |
| `AppRail` | components/layout | `components/layout/app-rail/app-rail.tsx` | `components/layout/app-rail.mdx` | `layout/app-rail/basic.tsx` | YES | YES | Stable |
| `AppRailFooter` | components/layout | `components/layout/app-rail/app-rail.tsx` | `components/layout/app-rail.mdx` | `layout/app-rail/basic.tsx` | YES | NO | Stable |
| `AppRailHeader` | components/layout | `components/layout/app-rail/app-rail.tsx` | `components/layout/app-rail.mdx` | `layout/app-rail/basic.tsx` | YES | NO | Stable |
| `AppRailItem` | components/layout | `components/layout/app-rail/app-rail.tsx` | `components/layout/app-rail.mdx` | `layout/app-rail/basic.tsx` | YES | YES | Stable |
| `AppRailSeparator` | components/layout | `components/layout/app-rail/app-rail.tsx` | `components/layout/app-rail.mdx` | `layout/app-rail/basic.tsx` | YES | NO | Stable |
| `AppSwitcher` | widgets | `widgets/app-switcher/app-switcher.tsx` | `widgets/app-switcher.mdx` | `widgets/app-switcher/basic.tsx` | YES | YES | Stable |
| `AreaChart` | charts | `charts/cartesian-charts.tsx` | `charts/cartesian.mdx` | `charts/cartesian/area.tsx` | YES | YES | Stable |
| `Avatar` | components/data-display | `components/data-display/avatar/avatar.tsx` | `components/data-display/avatar.mdx` | `data-display/avatar/basic.tsx` | YES | YES | Stable |
| `AvatarFallback` | components/data-display | `components/data-display/avatar/avatar.tsx` | `components/data-display/avatar.mdx` | `data-display/avatar/basic.tsx` | YES | YES | Stable |
| `AvatarGroup` | components/data-display | `components/data-display/avatar/avatar.tsx` | `components/data-display/avatar.mdx` | `data-display/avatar/basic.tsx` | YES | YES | Stable |
| `AvatarImage` | components/data-display | `components/data-display/avatar/avatar.tsx` | `components/data-display/avatar.mdx` | `data-display/avatar/basic.tsx` | YES | NO | Stable |
| `Badge` | components/data-display | `components/data-display/badge/badge.tsx` | `components/data-display/badge.mdx` | `data-display/badge/basic.tsx` | YES | YES | Stable |
| `BarChart` | charts | `charts/cartesian-charts.tsx` | `charts/cartesian.mdx` | `charts/cartesian/bar.tsx` | YES | YES | Stable |
| `Breadcrumb` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `BreadcrumbEllipsis` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | NO | Stable |
| `BreadcrumbItem` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `BreadcrumbLink` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `BreadcrumbList` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `BreadcrumbPage` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `BreadcrumbSeparator` | components/navigation | `components/navigation/breadcrumb/breadcrumb.tsx` | `components/navigation/breadcrumb.mdx` | `navigation/breadcrumb/basic.tsx` | YES | YES | Stable |
| `Button` | components/actions | `components/actions/button/button.tsx` | `components/actions/button.mdx` | `actions/button-group/basic.tsx` | YES | YES | Stable |
| `ButtonGroup` | components/actions | `components/actions/button-group/button-group.tsx` | `components/actions/button-group.mdx` | `actions/button-group/basic.tsx` | YES | YES | Stable |
| `Calendar` | components/forms | `components/forms/calendar/calendar.tsx` | `components/forms/calendar.mdx` | `widgets/notification-bell/basic.tsx` | YES | YES | Stable |
| `Card` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | YES | Stable |
| `CardAction` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | NO | Stable |
| `CardContent` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | YES | Stable |
| `CardDescription` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | NO | Stable |
| `CardFooter` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | NO | Stable |
| `CardHeader` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | NO | Stable |
| `CardTitle` | components/data-display | `components/data-display/card/card.tsx` | `components/data-display/card.mdx` | `data-display/card/basic.tsx` | YES | YES | Stable |
| `ChangeLog` | widgets | `widgets/change-log/change-log.tsx` | `widgets/change-log.mdx` | `widgets/change-log/basic.tsx` | YES | YES | Beta |
| `ChartColor` | charts | `./chart-utils` | `charts/donut.mdx` | `MISSING` | NO | NO | Stable |
| `ChartLegend` | charts | `./chart-utils` | `MISSING` | `MISSING` | YES | NO | Unknown |
| `ChartLegendProps` | charts | `./chart-utils` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ChartSeries` | charts | `./chart-utils` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ChartTooltipContent` | charts | `./chart-utils` | `MISSING` | `MISSING` | YES | NO | Unknown |
| `ChartTooltipContentProps` | charts | `./chart-utils` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `Checkbox` | components/forms | `components/forms/checkbox/checkbox.tsx` | `components/forms/checkbox.mdx` | `overlays/sheet/basic.tsx` | YES | YES | Stable |
| `CheckboxGroup` | components/forms | `components/forms/checkbox-group/checkbox-group.tsx` | `components/forms/checkbox.mdx` | `forms/checkbox/group.tsx` | YES | NO | Stable |
| `Collapsible` | components/navigation | `components/navigation/collapsible/collapsible.tsx` | `components/navigation/collapsible.mdx` | `navigation/collapsible/basic.tsx` | YES | YES | Stable |
| `CollapsiblePanel` | components/navigation | `components/navigation/collapsible/collapsible.tsx` | `components/navigation/collapsible.mdx` | `navigation/collapsible/basic.tsx` | YES | YES | Stable |
| `CollapsibleTrigger` | components/navigation | `components/navigation/collapsible/collapsible.tsx` | `components/navigation/collapsible.mdx` | `navigation/collapsible/basic.tsx` | YES | YES | Stable |
| `Combobox` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxContent` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxEmpty` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxGroup` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `MISSING` | YES | NO | Beta |
| `ComboboxGroupLabel` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `MISSING` | YES | NO | Beta |
| `ComboboxInput` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxItem` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxList` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `forms/combobox/basic.tsx` | YES | NO | Beta |
| `ComboboxSeparator` | components/forms | `components/forms/combobox/combobox.tsx` | `components/forms/combobox.mdx` | `MISSING` | YES | NO | Beta |
| `CommandPalette` | components/overlays | `components/overlays/command-palette/command-palette.tsx` | `components/overlays/command-palette.mdx` | `overlays/command-palette/basic.tsx` | YES | YES | Stable |
| `ContextMenu` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | YES | NO | Stable |
| `ContextMenuCheckboxItem` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `MISSING` | NO | NO | Stable |
| `ContextMenuContent` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | YES | NO | Stable |
| `ContextMenuGroup` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ContextMenuGroupLabel` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ContextMenuItem` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | NO | NO | Stable |
| `ContextMenuLinkItem` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ContextMenuRadioGroup` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `MISSING` | NO | NO | Stable |
| `ContextMenuRadioItem` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ContextMenuSeparator` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | NO | NO | Stable |
| `ContextMenuShortcut` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | NO | NO | Stable |
| `ContextMenuSub` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `MISSING` | NO | NO | Stable |
| `ContextMenuSubTrigger` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `ContextMenuTrigger` | components/overlays | `components/overlays/context-menu/context-menu.tsx` | `components/overlays/context-menu.mdx` | `overlays/context-menu/basic.tsx` | YES | NO | Stable |
| `CountrySelect` | components/forms | `components/forms/locale-select/locale-select.tsx` | `components/forms/locale-select.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `CurrencySelect` | components/forms | `components/forms/locale-select/locale-select.tsx` | `components/forms/locale-select.mdx` | `forms/locale-select/basic.tsx` | YES | YES | Stable |
| `DataTable` | components/data-display | `components/data-display/data-table/data-table.tsx` | `components/data-display/data-table.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Beta |
| `DateFormatSelect` | components/forms | `components/forms/locale-select/locale-select.tsx` | `components/forms/locale-select.mdx` | `examples/setup-wizard.tsx` | YES | NO | Stable |
| `DatePicker` | components/forms | `components/forms/date-picker/date-picker.tsx` | `components/forms/date-picker.mdx` | `forms/date-picker/basic.tsx` | YES | YES | Stable |
| `DateRangePicker` | components/forms | `components/forms/date-picker/date-picker.tsx` | `components/forms/date-picker.mdx` | `forms/date-picker/basic.tsx` | YES | YES | Stable |
| `Dialog` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `DialogClose` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | NO | Stable |
| `DialogContent` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `DialogDescription` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `DialogFooter` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | NO | Stable |
| `DialogHeader` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | NO | Stable |
| `DialogTitle` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `DialogTrigger` | components/overlays | `components/overlays/dialog/dialog.tsx` | `components/overlays/dialog.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `DonutChart` | charts | `charts/donut-chart.tsx` | `charts/donut.mdx` | `charts/donut/basic.tsx` | YES | YES | Stable |
| `DropdownMenu` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Stable |
| `DropdownMenuCheckboxItem` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | YES | Stable |
| `DropdownMenuContent` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Stable |
| `DropdownMenuGroup` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuGroupLabel` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuItem` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Stable |
| `DropdownMenuLinkItem` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `MISSING` | YES | NO | Stable |
| `DropdownMenuRadioGroup` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuRadioItem` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuSeparator` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `data-display/data-table/basic.tsx` | YES | NO | Stable |
| `DropdownMenuShortcut` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuSub` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuSubTrigger` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `overlays/dropdown-menu/basic.tsx` | YES | NO | Stable |
| `DropdownMenuTrigger` | components/overlays | `components/overlays/dropdown-menu/dropdown-menu.tsx` | `components/overlays/dropdown-menu.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Stable |
| `EmptyState` | components/data-display | `components/data-display/empty-state/empty-state.tsx` | `components/data-display/empty-state.mdx` | `data-display/empty-state/basic.tsx` | YES | YES | Stable |
| `EntityList` | widgets | `widgets/entity-list/entity-list.tsx` | `examples/dashboard.mdx` | `examples/dashboard.tsx` | YES | YES | Stable |
| `Field` | components/forms | `components/forms/field/field.tsx` | `components/forms/field.mdx` | `navigation/collapsible/basic.tsx` | YES | YES | Stable |
| `FieldDescription` | components/forms | `components/forms/field/field.tsx` | `components/forms/field.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `FieldError` | components/forms | `components/forms/field/field.tsx` | `components/forms/input.mdx` | `examples/setup-wizard.tsx` | YES | YES | Stable |
| `FieldItem` | components/forms | `components/forms/field/field.tsx` | `components/forms/field.mdx` | `MISSING` | YES | NO | Stable |
| `FieldLabel` | components/forms | `components/forms/field/field.tsx` | `components/forms/input.mdx` | `navigation/collapsible/basic.tsx` | YES | YES | Stable |
| `Fieldset` | components/forms | `components/forms/fieldset/fieldset.tsx` | `components/forms/field.mdx` | `forms/field/form.tsx` | YES | NO | Stable |
| `FieldsetLegend` | components/forms | `components/forms/fieldset/fieldset.tsx` | `components/forms/field.mdx` | `forms/field/form.tsx` | YES | NO | Stable |
| `FileDropzone` | components/forms | `components/forms/file-dropzone/file-dropzone.tsx` | `components/forms/file-dropzone.mdx` | `forms/file-dropzone/basic.tsx` | YES | YES | Beta |
| `Form` | components/forms | `components/forms/form/form.tsx` | `components/layout/form-layout.mdx` | `overlays/dialog/basic.tsx` | YES | YES | Stable |
| `FormActions` | components/layout | `components/layout/form-layout/form-layout.tsx` | `components/layout/form-layout.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `FormGrid` | components/layout | `components/layout/form-layout/form-layout.tsx` | `components/layout/form-layout.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `FormSection` | components/layout | `components/layout/form-layout/form-layout.tsx` | `components/layout/form-layout.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `Gauge` | components/feedback | `components/feedback/gauge/gauge.tsx` | `components/feedback/gauge.mdx` | `feedback/gauge/basic.tsx` | YES | YES | Beta |
| `IconTile` | components/data-display | `components/data-display/icon-tile/icon-tile.tsx` | `components/data-display/icon-tile.mdx` | `data-display/icon-tile/basic.tsx` | YES | YES | Stable |
| `Input` | components/forms | `components/forms/input/input.tsx` | `components/forms/input.mdx` | `data-display/data-table/basic.tsx` | YES | YES | Stable |
| `InputGroup` | components/forms | `components/forms/input-group/input-group.tsx` | `components/forms/input-group.mdx` | `forms/input-group/basic.tsx` | YES | YES | Stable |
| `InputGroupAddon` | components/forms | `components/forms/input-group/input-group.tsx` | `components/forms/input-group.mdx` | `forms/input-group/basic.tsx` | YES | YES | Stable |
| `InputGroupInput` | components/forms | `components/forms/input-group/input-group.tsx` | `components/forms/input-group.mdx` | `forms/input-group/basic.tsx` | YES | YES | Stable |
| `KanbanBoard` | widgets | `widgets/kanban-board/kanban-board.tsx` | `widgets/kanban-board.mdx` | `widgets/kanban-board/basic.tsx` | YES | YES | Beta |
| `Kbd` | components/data-display | `components/data-display/kbd/kbd.tsx` | `components/data-display/kbd.mdx` | `data-display/kbd/basic.tsx` | YES | NO | Stable |
| `Label` | components/forms | `components/forms/label/label.tsx` | `components/actions/toggle-group.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `LanguageSelect` | components/forms | `components/forms/locale-select/locale-select.tsx` | `components/forms/locale-select.mdx` | `examples/setup-wizard.tsx` | YES | YES | Stable |
| `LineChart` | charts | `charts/cartesian-charts.tsx` | `charts/cartesian.mdx` | `charts/cartesian/line.tsx` | YES | YES | Stable |
| `Meter` | components/feedback | `components/feedback/meter/meter.tsx` | `components/feedback/meter.mdx` | `examples/dashboard.tsx` | YES | YES | Stable |
| `MetricCard` | widgets | `widgets/metric-card/metric-card.tsx` | `widgets/metric-card.mdx` | `widgets/metric-card/variants.tsx` | YES | YES | Stable |
| `MetricDelta` | widgets | `widgets/metric-card/metric-card.tsx` | `widgets/metric-card.mdx` | `MISSING` | YES | NO | Stable |
| `MetricGrid` | widgets | `widgets/metric-card/metric-card.tsx` | `widgets/metric-card.mdx` | `widgets/metric-card/variants.tsx` | YES | YES | Stable |
| `NotificationBell` | widgets | `widgets/notifications/notifications.tsx` | `widgets/notification-bell.mdx` | `widgets/notification-bell/basic.tsx` | YES | YES | Stable |
| `NotificationList` | widgets | `widgets/notifications/notifications.tsx` | `widgets/notification-bell.mdx` | `MISSING` | YES | NO | Stable |
| `NumberField` | components/forms | `components/forms/number-field/number-field.tsx` | `components/forms/number-field.mdx` | `forms/number-field/basic.tsx` | YES | YES | Stable |
| `PageHeader` | components/layout | `components/layout/page-header/page-header.tsx` | `components/layout/page-header.mdx` | `layout/page-header/basic.tsx` | YES | YES | Stable |
| `Pagination` | components/navigation | `components/navigation/pagination/pagination.tsx` | `components/navigation/pagination.mdx` | `navigation/pagination/basic.tsx` | YES | YES | Stable |
| `PasswordInput` | components/forms | `components/forms/input-group/input-group.tsx` | `components/forms/input-group.mdx` | `forms/input-group/basic.tsx` | YES | YES | Stable |
| `PermissionMatrix` | widgets | `widgets/permission-matrix/permission-matrix.tsx` | `widgets/permission-matrix.mdx` | `widgets/permission-matrix/basic.tsx` | YES | YES | Beta |
| `Popover` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `overlays/popover/basic.tsx` | YES | YES | Stable |
| `PopoverClose` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `MISSING` | YES | NO | Stable |
| `PopoverContent` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `overlays/popover/basic.tsx` | YES | YES | Stable |
| `PopoverDescription` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `overlays/popover/basic.tsx` | YES | NO | Stable |
| `PopoverTitle` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `overlays/popover/basic.tsx` | YES | YES | Stable |
| `PopoverTrigger` | components/overlays | `components/overlays/popover/popover.tsx` | `components/overlays/popover.mdx` | `overlays/popover/basic.tsx` | YES | YES | Stable |
| `Progress` | components/feedback | `components/feedback/progress/progress.tsx` | `components/feedback/progress.mdx` | `feedback/progress/basic.tsx` | YES | YES | Stable |
| `QuickActions` | widgets | `widgets/quick-actions/quick-actions.tsx` | `examples/dashboard.mdx` | `examples/dashboard.tsx` | YES | YES | Stable |
| `Radio` | components/forms | `components/forms/radio-group/radio-group.tsx` | `components/forms/radio-group.mdx` | `forms/radio-group/basic.tsx` | YES | YES | Stable |
| `RadioGroup` | components/forms | `components/forms/radio-group/radio-group.tsx` | `components/forms/radio-group.mdx` | `forms/radio-group/basic.tsx` | YES | YES | Stable |
| `RichTextEditor` | editor | `editor/rich-text-editor.tsx` | `components/forms/rich-text-editor.mdx` | `forms/rich-text-editor/basic.tsx` | YES | YES | Beta |
| `ScrollArea` | components/layout | `components/layout/scroll-area/scroll-area.tsx` | `components/layout/scroll-area.mdx` | `layout/scroll-area/basic.tsx` | YES | NO | Stable |
| `SearchInput` | components/forms | `components/forms/input-group/input-group.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | YES | Stable |
| `SearchableSelect` | components/forms | `components/forms/searchable-select/searchable-select.tsx` | `components/forms/searchable-select.mdx` | `forms/searchable-select/basic.tsx` | YES | YES | Stable |
| `Select` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `navigation/accordion/basic.tsx` | YES | YES | Stable |
| `SelectContent` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SelectGroup` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `forms/select/basic.tsx` | YES | NO | Stable |
| `SelectGroupLabel` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `forms/select/basic.tsx` | YES | NO | Stable |
| `SelectItem` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SelectSeparator` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `forms/select/basic.tsx` | YES | NO | Stable |
| `SelectTrigger` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SelectValue` | components/forms | `components/forms/select/select.tsx` | `components/forms/select.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `Separator` | components/layout | `components/layout/separator/separator.tsx` | `components/layout/separator.mdx` | `layout/separator/basic.tsx` | YES | YES | Stable |
| `Sheet` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | YES | Stable |
| `SheetBody` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SheetClose` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SheetContent` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | YES | Stable |
| `SheetDescription` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SheetFooter` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SheetHeader` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | NO | Stable |
| `SheetTitle` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | YES | Stable |
| `SheetTrigger` | components/overlays | `components/overlays/sheet/sheet.tsx` | `components/overlays/sheet.mdx` | `overlays/sheet/basic.tsx` | YES | YES | Stable |
| `Sidebar` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarContent` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarFooter` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/basic.tsx` | YES | NO | Stable |
| `SidebarGroup` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/nav-submenu.tsx` | YES | YES | Stable |
| `SidebarGroupAction` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | YES | YES | Stable |
| `SidebarGroupLabel` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/nav-submenu.tsx` | YES | NO | Stable |
| `SidebarHeader` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | NO | Stable |
| `SidebarInset` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarMenu` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarMenuAction` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | YES | NO | Stable |
| `SidebarMenuBadge` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | YES | YES | Stable |
| `SidebarMenuButton` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarMenuItem` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarMenuSub` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/nav-submenu.tsx` | YES | YES | Stable |
| `SidebarMenuSubButton` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/nav-submenu.tsx` | YES | YES | Stable |
| `SidebarMenuSubItem` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/nav-submenu.tsx` | YES | YES | Stable |
| `SidebarProvider` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `layout/sidebar/variants.tsx` | YES | YES | Stable |
| `SidebarRail` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | YES | NO | Stable |
| `SidebarSeparator` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | YES | NO | Stable |
| `SidebarTrigger` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | YES | Stable |
| `Skeleton` | components/feedback | `components/feedback/skeleton/skeleton.tsx` | `components/feedback/skeleton.mdx` | `feedback/skeleton/basic.tsx` | YES | YES | Stable |
| `Slider` | components/forms | `components/forms/slider/slider.tsx` | `components/forms/slider.mdx` | `forms/slider/basic.tsx` | YES | YES | Stable |
| `Sparkline` | widgets | `widgets/sparkline/sparkline.tsx` | `widgets/sparkline.mdx` | `widgets/sparkline/basic.tsx` | YES | YES | Stable |
| `Spinner` | components/feedback | `components/feedback/spinner/spinner.tsx` | `components/feedback/spinner.mdx` | `feedback/spinner/basic.tsx` | YES | YES | Stable |
| `SplitPane` | components/layout | `components/layout/split-pane/split-pane.tsx` | `components/layout/split-pane.mdx` | `layout/split-pane/basic.tsx` | YES | YES | Beta |
| `Stat` | components/data-display | `components/data-display/stat/stat.tsx` | `components/data-display/stat.mdx` | `data-display/stat/basic.tsx` | YES | YES | Stable |
| `Stepper` | components/navigation | `components/navigation/stepper/stepper.tsx` | `components/navigation/stepper.mdx` | `navigation/stepper/vertical.tsx` | YES | YES | Stable |
| `Switch` | components/forms | `components/forms/switch/switch.tsx` | `components/forms/switch.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `Table` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableBody` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableCaption` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableCell` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableFooter` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableHead` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableHeader` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `TableRow` | components/data-display | `components/data-display/table/table.tsx` | `components/data-display/table.mdx` | `data-display/table/basic.tsx` | YES | NO | Stable |
| `Tabs` | components/navigation | `components/navigation/tabs/tabs.tsx` | `components/navigation/tabs.mdx` | `navigation/tabs/basic.tsx` | YES | YES | Stable |
| `TabsList` | components/navigation | `components/navigation/tabs/tabs.tsx` | `components/navigation/tabs.mdx` | `navigation/tabs/basic.tsx` | YES | YES | Stable |
| `TabsPanel` | components/navigation | `components/navigation/tabs/tabs.tsx` | `components/navigation/tabs.mdx` | `navigation/tabs/basic.tsx` | YES | YES | Stable |
| `TabsTab` | components/navigation | `components/navigation/tabs/tabs.tsx` | `components/navigation/tabs.mdx` | `navigation/tabs/basic.tsx` | YES | YES | Stable |
| `TagInput` | components/forms | `components/forms/tag-input/tag-input.tsx` | `components/forms/tag-input.mdx` | `forms/tag-input/basic.tsx` | YES | YES | Beta |
| `Textarea` | components/forms | `components/forms/textarea/textarea.tsx` | `components/forms/textarea.mdx` | `forms/textarea/basic.tsx` | YES | YES | Stable |
| `TimezoneSelect` | components/forms | `components/forms/locale-select/locale-select.tsx` | `components/forms/locale-select.mdx` | `layout/form-layout/basic.tsx` | YES | YES | Stable |
| `Toaster` | components/feedback | `components/feedback/toast/toast.tsx` | `components/feedback/toast.mdx` | `MISSING` | YES | YES | Stable |
| `Toggle` | components/actions | `components/actions/toggle/toggle.tsx` | `components/actions/toggle-group.mdx` | `actions/toggle/basic.tsx` | YES | YES | Stable |
| `ToggleGroup` | components/actions | `components/actions/toggle-group/toggle-group.tsx` | `components/actions/toggle-group.mdx` | `actions/toggle-group/basic.tsx` | YES | YES | Stable |
| `ToggleGroupItem` | components/actions | `components/actions/toggle-group/toggle-group.tsx` | `components/actions/toggle-group.mdx` | `actions/toggle-group/basic.tsx` | YES | YES | Stable |
| `Tooltip` | components/overlays | `components/overlays/tooltip/tooltip.tsx` | `components/overlays/tooltip.mdx` | `overlays/tooltip/basic.tsx` | YES | NO | Stable |
| `TooltipContent` | components/overlays | `components/overlays/tooltip/tooltip.tsx` | `components/overlays/tooltip.mdx` | `overlays/tooltip/basic.tsx` | YES | NO | Stable |
| `TooltipProvider` | components/overlays | `components/overlays/tooltip/tooltip.tsx` | `installation.mdx` | `MISSING` | YES | NO | Stable |
| `TooltipTrigger` | components/overlays | `components/overlays/tooltip/tooltip.tsx` | `components/overlays/tooltip.mdx` | `overlays/tooltip/basic.tsx` | YES | NO | Stable |
| `TopBar` | components/layout | `components/layout/top-bar/top-bar.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | YES | Stable |
| `TopBarCenter` | components/layout | `components/layout/top-bar/top-bar.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | NO | Stable |
| `TopBarEnd` | components/layout | `components/layout/top-bar/top-bar.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | YES | Stable |
| `TopBarStart` | components/layout | `components/layout/top-bar/top-bar.tsx` | `components/layout/top-bar.mdx` | `layout/top-bar/basic.tsx` | YES | YES | Stable |
| `TreeView` | components/data-display | `components/data-display/tree-view/tree-view.tsx` | `components/data-display/tree-view.mdx` | `data-display/tree-view/basic.tsx` | YES | YES | Beta |
| `UserMenu` | widgets | `widgets/user-menu/user-menu.tsx` | `widgets/user-menu.mdx` | `widgets/user-menu/basic.tsx` | YES | YES | Stable |
| `WelcomeBanner` | widgets | `widgets/welcome-banner/welcome-banner.tsx` | `examples/dashboard.mdx` | `examples/dashboard.tsx` | YES | YES | Stable |
| `WidgetCard` | widgets | `widgets/widget-card/widget-card.tsx` | `widgets/widget-card.mdx` | `widgets/widget-card/basic.tsx` | YES | YES | Stable |
| `badgeVariants` | components/data-display | `components/data-display/badge/badge.tsx` | `components/data-display/badge.mdx` | `MISSING` | NO | NO | Stable |
| `buttonVariants` | components/actions | `components/actions/button/button-variants.ts` | `installation.mdx` | `MISSING` | NO | YES | Stable |
| `compareSortValues` | components/data-display | `components/data-display/data-table/sort.ts` | `MISSING` | `MISSING` | NO | YES | Unknown |
| `defaultDateFormats` | components/forms | `components/forms/locale-select/locale-select.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `defaultDateRangePresets` | components/forms | `components/forms/date-picker/date-range-presets.ts` | `components/forms/date-picker.mdx` | `MISSING` | NO | NO | Stable |
| `fileMatchesAccept` | components/forms | `components/forms/file-dropzone/file-utils.ts` | `MISSING` | `MISSING` | NO | YES | Unknown |
| `formatBytes` | components/forms | `components/forms/file-dropzone/file-utils.ts` | `components/forms/file-dropzone.mdx` | `MISSING` | NO | YES | Beta |
| `formatDelta` | widgets | `widgets/metric-card/delta.ts` | `widgets/metric-card.mdx` | `MISSING` | NO | YES | Stable |
| `getPaginationRange` | components/navigation | `components/navigation/pagination/use-pagination.ts` | `components/navigation/pagination.mdx` | `MISSING` | NO | YES | Stable |
| `getSentiment` | widgets | `widgets/metric-card/delta.ts` | `widgets/metric-card.mdx` | `MISSING` | NO | YES | Stable |
| `getTrend` | widgets | `widgets/metric-card/delta.ts` | `widgets/metric-card.mdx` | `MISSING` | NO | YES | Stable |
| `inputVariants` | components/forms | `components/forms/input/input-variants.ts` | `components/forms/input.mdx` | `MISSING` | NO | NO | Stable |
| `labelClassName` | components/forms | `components/forms/label/label.tsx` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `moveKanbanItem` | widgets | `widgets/kanban-board/kanban-board.tsx` | `widgets/kanban-board.mdx` | `MISSING` | NO | YES | Beta |
| `nextSortState` | components/data-display | `components/data-display/data-table/sort.ts` | `MISSING` | `MISSING` | NO | YES | Unknown |
| `permissionKey` | widgets | `widgets/permission-matrix/permission-matrix.tsx` | `widgets/permission-matrix.mdx` | `MISSING` | NO | YES | Beta |
| `toast` | components/feedback | `components/feedback/toast/toast.tsx` | `installation.mdx` | `data-display/data-table/basic.tsx` | NO | YES | Stable |
| `toggleVariants` | components/actions | `components/actions/toggle/toggle-variants.ts` | `MISSING` | `MISSING` | NO | NO | Unknown |
| `useSidebar` | components/layout | `components/layout/sidebar/sidebar.tsx` | `components/layout/sidebar.mdx` | `MISSING` | NO | NO | Stable |
