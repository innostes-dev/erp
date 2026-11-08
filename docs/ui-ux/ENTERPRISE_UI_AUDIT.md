# INNOSTES Business OS — Enterprise UI/UX Audit & Design System Plan

| | |
|---|---|
| **Version** | 2.1 (final; adds the landing website & docs audit, §14. Supersedes v1 and every earlier palette discussion, including Electric Sapphire.) |
| **Design direction** | Executive Blue + Midnight Navy + Neutral Foundation + Restrained Teal |
| **Stage** | 2 of 2: **implemented** on branch `feat/enterprise-design-system` (see §15). Sections 0–14 are the approved plan. |
| **Date** | 2026-11-08 |
| **Scope** | **Product:** `apps/web-app`, `packages/ui`, `kernel/frontend`, `modules/*/frontend`, `plugins/*/frontend`. **Website:** `apps/landing` (marketing pages + component/developer/API docs), see §14. |
| **Status** | Implemented and verified; open items in §15.4 |

---

## Contents

0. [Executive summary](#0-executive-summary)
1. [Current architecture](#1-current-architecture)
2. [Updated UI/UX audit](#2-updated-uiux-audit)
3. [Final design token specification](#3-final-design-token-specification)
4. [Contrast verification & required decisions](#4-contrast-verification--required-decisions)
5. [Proposed theme architecture](#5-proposed-theme-architecture)
6. [Application shell redesign](#6-application-shell-redesign)
7. [Component colour & transformation plan](#7-component-colour--transformation-plan)
8. [Page templates](#8-page-templates)
9. [Module-wise transformation matrix](#9-module-wise-transformation-matrix)
10. [Implementation roadmap](#10-implementation-roadmap)
11. [Technical risks](#11-technical-risks)
12. [Acceptance criteria & regression testing](#12-acceptance-criteria--regression-testing)
13. [Decisions required before Stage 2](#13-decisions-required-before-stage-2)
14. [Landing website & documentation](#14-landing-website--documentation)
15. [Implementation status](#15-implementation-status)

---

## 0. Executive summary

The **foundation is stronger than the surface**. `@innostes/ui` is a capable library: built on Base UI, semantic tokens, CVA variants, focus-visible rings, `DataTable`, a collapsible/mobile `Sidebar`, `CommandPalette`, `FormLayout`, `Skeleton` and `DatePicker`, all tested across React 17/18/19.

The **application layer barely uses it.** Screens were built page by page (several by parallel bot implementations), each hand-styling cards, KPI tiles, badges and lists with raw Tailwind colours, arbitrary pixel sizes, gradients and emoji. The result is a set of unrelated "cockpits" rather than one product.

**Measured across app-layer source** (`apps/web-app/src`, `kernel/frontend/src`, `modules/*/frontend/src`, `plugins/*/frontend/src`):

| Signal | Count | Consequence |
|---|---|---|
| Raw Tailwind palette classes | **462** (blue 145 · emerald 104 · rose 71 · amber 62 · slate 35 · purple 32 · teal 6 · indigo 5 · zinc 2) | The approved palette can't be applied centrally |
| Ad-hoc opacity tints of tokens (`bg-primary/10`, `bg-muted/15`, …) | **254** | Unmanaged tints; the defined Primary Tint `#EEF2FD` would be bypassed |
| Arbitrary font sizes (`text-[10px]`, …) | **206** | No type scale; much text below 12px |
| `font-bold` / `font-extrabold` | **151 / 6** | Weight inflation flattens hierarchy |
| `rounded-xl/2xl/3xl` | **80** | Soft "startup template" look |
| `shadow-*` in app code | **87** | Elevation has no meaning |
| Module "tone" colour assignments | **41** | Each module gets its own hue, which contradicts the direction |
| `dark:` one-off overrides | **60** | Dark mode patched per element instead of by token |
| Gradient banners | **8 files** | Every module dashboard opens with a gradient hero |
| Files with emoji in UI copy | **9** | Unprofessional; read aloud by screen readers |
| `aria-*` attributes (app layer) | **8** | Accessibility relies entirely on library defaults |
| TypeScript errors (`tsc -p apps/web-app/tsconfig.app.json`) | **96** (48 type errors, 48 unused imports) | Real defects hidden in the noise |
| Library components with **zero** app usage | `DataTable`, `FormLayout`, `Skeleton`, `Tooltip`, `SkipLink`, `CommandPalette`, `DatePicker`, `AlertDialog`, `@innostes/ui/charts` | The best enterprise building blocks are unused |

**Governing principle (decided):** **One palette, one set of pieces, everywhere.** The approved brand colours (§3) live once in `@innostes/ui` and are used unchanged by the product, the website and the docs. Every screen and page is assembled from the same shared pieces (tokens → components → patterns → templates; see §5.7). Nothing is hand-styled per page, per module or per surface.

**Strategy:**
1. **Re-value the token layer.** The library already references semantic tokens (`bg-primary`, `bg-sidebar`, `text-muted-foreground`) and defines them with `@theme default`, so most of the shift needs no component edits.
2. **Unify three app shells into one** persistent navy shell with URL-addressable pages.
3. **Migrate screens onto existing library components** through five page templates.
4. **Enforce it**: a CI guard that rejects raw palette classes, arbitrary pixel sizes, gradients and emoji.

**Six mandated colour pairings fail WCAG 2.2 AA** (§4). Each has a proposed fix that keeps the approved colours, and needs your sign-off.

**The landing website (§14) is further from the direction than the product.** It has 2,401 raw palette classes, an orange/violet/pink "Cadence-style" gradient identity, glassmorphism, a temporary code-drawn mark instead of the existing INNOSTES logo, and a second token system (Fumadocs `fd-*` + its own `brand-*` blue scale) alongside `@innostes/ui`. Because it imports `@innostes/ui` tokens, any library-level palette change restyles it automatically, and its visual-regression snapshots will fail.

---

## 1. Current architecture

### 1.1 Monorepo (pnpm + Nx)

```
apps/web-app/          Vite + React 19 SPA (the Business OS client)
apps/api-server/       FastAPI backend
apps/landing/          Next.js marketing/docs site (consumes @innostes/ui tokens)
packages/ui/           @innostes/ui: Base UI + Tailwind v4 + CVA component library
kernel/frontend/       @innostes/kernel: API client, AuthGate/AuthPage, SetupGate/SetupWizard
modules/peopleops/frontend   HRMS tabs (Employees, Attendance, Leave, Payroll, Expenses, Offboarding, Masters)
modules/salesflow/frontend   SalesFlowPage (currently unused, see §2.6)
plugins/tracura/frontend     API-telemetry plugin (one 2,887-line file)
```

### 1.2 Entry, providers, routing

- `main.tsx`: `SetupGate` → `AuthGate` → `App` (+ global `Toaster`).
- `App`: `NavigationProvider` → `TenantProvider` → `ModulesProvider` → `PluginsProvider` → `AppRouter`.
- **Hand-rolled router.** `NavigationContext.tsx` wraps `history.pushState`/`popstate`. `AppRouter` (`app.tsx:16-56`) is an `if/else` chain.
- **Three shells**, chosen by URL prefix:
  1. Ecosystem (`/`, `/modules`, `/plugins`, `/audit`, `/administration`): library `Sidebar` + `TopHeader`.
  2. Module (`/modules/:id`): `ModuleShellLayout.tsx` has its own TopBar, back button, AppSwitcher, breadcrumbs, UserMenu and a hand-built 240px `<aside>`.
  3. Plugin (`/plugins/:id`): `PluginShellLayout.tsx` is a near-copy. Tracura renders a third sidebar inside it.
- **Module sub-pages aren't in the URL** (`useState activeSubFeatureId`), so refresh, deep links, Back and bookmarks lose position.
- All `/administration/*` paths render `ApiKeysManager`.

### 1.3 Styling

- Tailwind v4. `apps/web-app/src/styles.css` imports `tailwindcss`, `@innostes/ui/tailwind.css`, `@innostes/ui/dark.css`, and `@source`s every workspace package.
- Tokens: `packages/ui/tailwind/theme.css` inside **`@theme default`** (app-level `@theme` wins). Values are currently zinc neutrals + Tailwind `blue-600`, with a white sidebar.
- Dark: `dark.css` (`.dark` / `[data-theme=dark]`), toggled in `TopHeader` with local state. Not persisted.
- **No font defined** (system stack). `index.html` title is `WebApp`. `app.module.css` is empty.
- The library uses `bg-background` **23 times** for control surfaces (button outline, input, checkbox, switch, tabs, toast, top-bar…). This determines the canvas-token decision in §5.3.

### 1.4 Data

- Shared client: `kernel/frontend/src/core/api/client.ts`. Tracura has its own `tracuraFetch` with a `localhost:8001` fallback.
- Most module dashboards, home activity and notifications are **static mock data**.

---

## 2. Updated UI/UX audit

Assessed against the final direction: neutral-dominant, blue = action, teal = intelligence, semantic = status, no module colours.

### 2.1 Hard-coded colours to replace

| Raw family | Count | Typical current use | Replace with |
|---|---|---|---|
| `blue-*` | 145 | Primary-ish accents, info, LedgerFlow identity, tenant avatar `bg-blue-600` | `primary`, `primary-tint`, `info-*`, or neutral |
| `emerald-*` | 104 | "Live", positive deltas, posted/approved | `success-icon` / `success-text` / `success-bg` |
| `rose-*` | 71 | Errors, 5xx, negative amounts | `error-icon` / `error-text` / `error-bg` |
| `amber-*` | 62 | Warnings, overdue, HireFlow identity, sun icon | `warning-*`; module identity → neutral |
| `slate-*` | 35 | Ad-hoc greys, `shadow-slate-200/50` | Neutral tokens |
| `purple-*` / `indigo-*` | 37 | 3xx codes, decoration | **No role in the palette.** Neutral, or `info` where meaningful. |
| `teal-*` | 6 | Decoration | `ai-*` tokens only when the content is AI/insight |
| Opacity tints `x/NN` | 254 | `bg-primary/5`, `/10`, `/20`, `bg-muted/15`, `bg-card/60` | `primary-tint`, `surface-subtle`, solid `card`; **no translucent surfaces** |
| Gradients | 8 files | Dashboard heroes, setup loader | Remove |
| `tone="chart-N"` | 41 | Module/app identity colour | Neutral icon tile; identity = icon + label |

**Worst offenders:** `TracuraPage.tsx` (253), `AuditTrailPage.tsx` (69), `LedgerFlowDashboard.tsx` (23), `SprintFlowDashboard.tsx` (21), `DocFlowDashboard.tsx` (16), `PeopleOpsDashboard.tsx` (15), `HireFlowDashboard.tsx` (15), `StockFlowDashboard.tsx` (14), `EcosystemHome.tsx` (12), `SalesFlowDashboard.tsx` (11).

### 2.2 Sidebar & navigation

| # | Issue | Location | Required change |
|---|---|---|---|
| N1 | Sidebar is **white**; module sidebar uses `bg-sidebar` with a blue pill active state; Tracura uses its own `w-64` aside | `SidebarNav.tsx`, `ModuleShellLayout.tsx:390`, `TracuraPage.tsx:852` | One solid Midnight Navy sidebar (§6) |
| N2 | Three shells; the global nav disappears inside modules ("← Ecosystem" back button) | `app.tsx`, both shell layouts | Single persistent shell; modules expand inline |
| N3 | Module active item = solid `bg-primary` + dot + `rounded-xl` | `ModuleShellLayout.tsx:416-422` | `#22385A` bg + `#8FA8F0` 3px bar + white text |
| N4 | Fragmented branding: "ECOSYSTEM / Platform", "Innostes ERP", "TRACURA", title `WebApp` | `SidebarNav.tsx:63`, `AuthPage.tsx:182`, `index.html:5` | "INNOSTES Business OS" lockup everywhere |
| N5 | Dead items: Bookmarks & Recent have `onClick={() => {}}` | `SidebarNav.tsx:122-138` | Hide until implemented |
| N6 | Global search and ⌘K hint do nothing; `CommandPalette` unmounted | `TopHeader.tsx:72-81` | Wire `CommandPalette` to catalog + pages |
| N7 | Tenant switcher is a `div` with `cursor-pointer` and no handler/role/keyboard | `SidebarNav.tsx:153` | Real `DropdownMenu` trigger |
| N8 | Sub-pages not URL-addressable; breadcrumbs use `onClick` without `href` | `ModuleShellLayout.tsx` | URL routes, real links, `aria-current` |
| N9 | Placeholder name "Arun" (×4), sample notifications, Help → `localhost:3000` | `TopHeader.tsx:63,95`, shells, `EcosystemHome.tsx` | Remove placeholders; env-based URLs |
| N10 | Top bar `bg-background/95 backdrop-blur` (translucent) | `TopHeader.tsx`, shells | Solid white surface + hairline border |

### 2.3 Dashboards

Every `apps/web-app/src/app/modules/*/…Dashboard.tsx` repeats one template, re-implemented each time:

- **Gradient hero** (`bg-gradient-to-r from-blue-500/10 …`, `rounded-2xl`) with an **emoji in the H1** ("LedgerFlow Cockpit 🏛️"). → Replace with `PageHeader` (title, context line, ≤1 primary + 1 secondary action).
- **Hand-built KPI tiles** (`Card` + `text-xs uppercase` + `text-2xl font-bold` + coloured `text-[11px]` caption, ~25 instances). → `MetricCard`: neutral card, 24/600 tabular value, delta as icon + text in semantic text colour.
- **Colourful cards & per-module hues.** → All cards white with a hairline border; colour only for status and the primary action.
- **Hand-built activity rows** (`rounded-xl border bg-muted/20`). → `ActivityFeed` / `EntityList`.
- **No charts.** → `@innostes/ui/charts` with the approved chart palette (§3.6).
- **No "needs attention" queue** except PeopleOps approvals. → Generalise to an `ActionList` on every dashboard.
- **No loading, empty or error states.** → Skeleton + EmptyState + error Alert per widget.
- **No AI insight pattern.** → `InsightCard` (teal, §7.3) where insights exist; none faked.

### 2.4 Forms

- **Reference implementations already exist:** `AuthPage` and `SetupWizard` use `Form`/`Field`/`FieldLabel`/`FieldError`/`FormActions` correctly.
- **`ExpensesTab.tsx`:** raw `<input>/<select>/<textarea>` with `border p-2`, and **`<Dialog>` with no `DialogContent`, so the modal can't render as a surface (functional bug).**
- No field grouping, required markers or inline validation in module forms. `FormLayout` and `DatePicker` are unused.
- Save/Cancel placement varies. No sticky footer for long forms (payroll, offboarding).
- Destructive actions don't use `AlertDialog` (0 usages).
- Native selects in Tracura (`:878`, `:898`) use `focus:ring-1`, weaker than the library focus ring.

### 2.5 Tables

| Screen | Finding |
|---|---|
| `AuditTrailPage.tsx` (866 lines) | Library `Table`/`Select` but 69 raw colours, translucent `bg-card/60` cards, own filter bar; 3 Select handler type errors (`:483/499/515`); no pagination component, sort or density |
| `ApiKeysManager.tsx` | Has loading + empty states (good); ad-hoc `rounded-xl shadow-2xs` containers; revoke without AlertDialog |
| `TracuraPage.tsx` | Own sidebar, ~80 `useState`, custom status badges (`:709-717`), native selects, 3-pane layout with no breakpoints |
| `ExpensesTab.tsx` | Raw `<thead>/<th>` inside `Table` |
| All | `DataTable` unused: no sortable columns, bulk selection, right-aligned tabular numerals, sticky headers, density or selected-row styling |

### 2.6 Shared-component opportunities (duplication)

| Duplication | Where | Consolidate into |
|---|---|---|
| App shell ×3 (TopBar + back + AppSwitcher + Breadcrumb + UserMenu) | `TopHeader.tsx`, `ModuleShellLayout.tsx:290-375`, `PluginShellLayout.tsx:80-160` | One `AppShell` |
| Secondary sidebars ×2 | Module shell `<aside>`, Tracura `<aside>` | Sections inside the single `Sidebar` |
| Module icon `switch` ×3 + 60-case sub-feature icon switch | `getModuleIcon`, `getItemIcon`, `getPluginIcon`, `getSubFeatureIcon` | `icon` field on catalog/manifest entries |
| Module pages ×2: `PeopleOpsPage` / `SalesFlowPage` (module packages, unused) vs `PeopleOpsDashboard` (557 lines) / `SalesFlowDashboard` in the app | `modules/*/frontend` vs `apps/web-app/src/app/modules/*` | Module UI in module packages; app only mounts it (matches `arch-check` boundaries) |
| KPI tile (~25) | All dashboards, AuditTrail, PeopleOps `DashboardTab` | `MetricCard` |
| Status-badge colour maps | Tracura, AuditTrail, dashboards | `Badge` semantic variants + per-domain `StatusBadge` map |
| Activity/list rows | Every dashboard | `ActivityFeed`, `EntityList`, `ActionList` |
| Page headers (each different) | Every page/tab | `PageHeader` |
| Native select styling | Tracura, Expenses | `Select` / `SearchableSelect` |

### 2.7 Module-wise visual inconsistencies

| Module | Identity colour today | Specific inconsistencies |
|---|---|---|
| Ecosystem Home | Primary blue + mountain SVG | Decorative illustration, `WelcomeBanner`, fake activity |
| PeopleOps | Emerald (`chart-3`) | App and module versions differ; `animate-pulse` "Live" pill; emerald-50 chips |
| SalesFlow | Violet (`chart-2`) | Gradient, emoji, stub banner |
| HireFlow | Amber (`chart-4`) | Amber identity collides with Warning semantics |
| LedgerFlow | Blue | `+$` / `-$` amounts colour-only; jargon ("Dr ≡ Cr", "Payroll DAG") |
| StockFlow / SprintFlow / DocFlow | Mixed | Same template issues; 5 emoji in DocFlow |
| Tracura | Blue logo tile + purple/rose/amber/emerald codes | Separate app look: own sidebar, branding, controls |
| Auth / Setup | Primary | `rounded-2xl shadow-xl`, gradient loader, emoji in wizard |

### 2.8 Responsive issues

| # | Issue |
|---|---|
| R1 | Module/plugin sidebars fixed `w-60`/`w-64` with no mobile behaviour (≈65% of a 360px viewport) |
| R2 | Module top bar overflows around 360px (back + switcher-with-name + user menu) |
| R3 | Only 15 `overflow-x-auto` app-wide; no priority columns or card fallback for tables |
| R4 | KPI grids jump `1 → md:4`; tablets get 4 cramped tiles |
| R5 | Expenses dialog: 4-column line-item grid that doesn't stack |
| R6 | Tracura 3-pane layout doesn't collapse |
| ✅ | Library `Sidebar` already becomes a sheet on mobile; `Button` enlarges on `pointer-coarse`. Propagate these patterns. |

### 2.9 Accessibility gaps (WCAG 2.2 AA)

| # | Gap | Criterion |
|---|---|---|
| A1 | No skip link (`SkipLink` unused); no `<main>` in the ecosystem shell | 2.4.1 |
| A2 | `document.title` always `WebApp`; no focus management on navigation | 2.4.2, 2.4.3 |
| A3 | Tenant switcher not keyboard-operable | 2.1.1, 4.1.2 |
| A4 | Nav items lack `aria-current="page"` | 1.3.1, 4.1.2 |
| A5 | Icon-only buttons have no `Tooltip` (0 usages) | 2.5.3 (sighted users) |
| A6 | Emoji in headings | 1.1.1 |
| A7 | Weak focus rings on Tracura native controls | 2.4.7, 2.4.11 |
| A8 | Status by colour alone (deltas, amounts, log rows) | 1.4.1 |
| A9 | 10px text (60+ occurrences) | 1.4.4 / legibility |
| A10 | No `prefers-reduced-motion` handling for `animate-pulse` / indeterminate bars | 2.3.3 (AAA, best practice) |
| A11 | Mandated colour pairings that fail (§4) | 1.4.3, 1.4.11 |

### 2.10 Visual quality vs. enterprise references

| Principle (SAP Fiori · Dynamics 365 · Salesforce · Oracle Fusion · Linear) | Today | Gap |
|---|---|---|
| One persistent shell, so the user always knows where they are | Shell changes per area | High |
| Object navigation with a URL per object | Sub-pages in component state | High |
| Calm, dense hierarchy | Hero banners, bold everywhere, 10px captions | High |
| Colour = meaning | Decorative per-module colour | High |
| Predictable list pages | Every list invents its own | High |
| Keyboard-first (⌘K) | Hint with nothing behind it | Medium |
| Quiet surfaces (hairlines, low elevation, small radii) | Mixed shadows, translucency, 16px radii | Medium |
| Honest states | Mock data, no skeletons | Medium → High once APIs are wired |

---

## 3. Final design token specification

All values below are the **approved** palette. Rows marked **◆** are additions needed to make the system complete (interaction states, component tokens) or to resolve the contrast failures in §4. They are derived from approved values and add no new brand hues.

### 3.1 Brand

| Token | Value | Use |
|---|---|---|
| `primary` | `#3157D5` | Primary buttons, important links, active tabs, selected states, focus |
| `primary-hover` | `#2447B8` | Hover/pressed of primary |
| `primary-tint` | `#EEF2FD` | Selected rows, active tab/segment bg, selected list items |
| `primary-foreground` | `#FFFFFF` | Text/icons on primary |
| `brand-navy` | `#14243A` | Sidebar, brand lockup, chart series 3 |
| `ai` (Teal) | `#0F766E` | AI/insight icon & accent, chart series 2, "New" indicators only |
| ◆ `ai-text` | `#115E59` | Strong teal text on `ai-tint` (7.27:1) |
| ◆ `ai-tint` | `#F0FDFA` | Insight card background (teal on it 5.25:1) |

### 3.2 Neutral foundation

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F8FAFC` | App background behind content |
| `surface` (card, popover) | `#FFFFFF` | Cards, tables, dialogs, drawers, menus, inputs |
| `surface-subtle` | `#F1F5F9` | Table header, toolbars, read-only fields, hover rows, skeleton base |
| `border` (hairline) | `#E2E8F0` | Dividers, card outlines, table row lines |
| `border-strong` (input / active) | `#CBD5E1` | Input borders, secondary button hover border, dividers needing emphasis (see §4 D2) |
| `text-primary` | `#1D2939` | Body, headings, table cells |
| `text-secondary` | `#667085` | Labels, metadata, helper text, placeholders |
| `text-muted` | `#94A3B8` | Disabled text, decorative icons, sidebar group labels (see §4 D1) |
| ◆ `surface-hover` | `#F1F5F9` | Hover for ghost buttons, menu items, rows (= `surface-subtle`) |
| ◆ `overlay` | `rgb(20 36 58 / 0.48)` | Backdrop (navy-based, not black) |

### 3.3 Secondary actions

| Token | Value |
|---|---|
| `secondary-bg` | `#FFFFFF` |
| `secondary-border` | `#D0D5DD` |
| `secondary-text` | `#1D2939` |
| ◆ `secondary-hover-bg` | `#F8FAFC` |
| ◆ `secondary-hover-border` | `#CBD5E1` |

### 3.4 Sidebar

| Token | Value |
|---|---|
| `sidebar-bg` | `#14243A` (solid, no gradient/texture) |
| `sidebar-text` | `#C0C8D4` |
| `sidebar-active-bg` | `#22385A` |
| `sidebar-active-text` | `#FFFFFF` |
| `sidebar-active-indicator` | `#8FA8F0` |
| ◆ `sidebar-hover-bg` | `#1E3350` |
| ◆ `sidebar-group-label` | `#94A3B8` (6.10:1 on navy) |
| ◆ `sidebar-border` | `rgb(255 255 255 / 0.08)` |
| ◆ `sidebar-focus` | `#8FA8F0` |

### 3.5 Semantic (status)

| Status | Icon / indicator | Text | Background | ◆ Solid fill (buttons/progress) |
|---|---|---|---|---|
| Success | `#15803D` | `#166534` | `#DCFCE7` | `#15803D` (white 5.02) |
| Warning | `#D97706` | `#B45309` | `#FEF3C7` | (no filled warning buttons) |
| Error | `#DC4C4C` | `#B42318` | `#FEE2E2` | **`#B42318`** (white 6.57). See §4 D3. |
| Information | `#3478D4` | `#2563B8` | `#DBEAFE` | (no filled info buttons) |

◆ Icon-on-background rule: on its own soft background, **Warning uses the text shade `#B45309` for icons** (see §4 D4).

### 3.6 Charts (◆ derived, validated ≥3:1 on white for marks)

| Series | Value | On white | Note |
|---|---|---|---|
| chart-1 | `#3157D5` Executive Blue | 6.08 | Primary series |
| chart-2 | `#0F766E` Teal | 5.47 | Secondary series (approved role) |
| chart-3 | `#14243A` Navy | 15.63 | |
| chart-4 | `#6B86E0` Light blue | 3.44 | |
| chart-5 | `#2C9A8F` Light teal | 3.43 | |
| chart-6 | `#64748B` Slate | 4.76 | "Other" / comparison / previous period |
| Gridlines / axes | `#E2E8F0` / `#667085` | | |
| Positive / negative | `success-icon` / `error-icon` | | Variance charts only |

Rules: ≤4 series per chart by default; direct labels or legend always; patterns/markers on line charts for colour-blind support; never use status colours for categories.

### 3.7 Typography

- **Family:** Inter (variable, self-hosted `woff2`, `font-display: swap`, preloaded). Fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Mono for IDs/codes: `ui-monospace, "JetBrains Mono", Menlo, monospace`.
- **Numerals:** `tabular-nums` for tables, KPIs, currency, dates, durations.
- **Weights:** 400 · 500 · 600 only (retire 700/800).
- **Fixed product scale** (fluid `clamp()` tokens remain for the landing site only):

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `text-caption` | 12 / 16 | 400–500 | Metadata, helper text, badges, table secondary. **Minimum size.** |
| `text-body-sm` | 13 / 20 | 400–500 | Table cells, nav items, dense lists |
| `text-body` | 14 / 20 | 400 | Default body, inputs, buttons (500) |
| `text-title-sm` | 16 / 24 | 600 | Card/section titles, dialog titles |
| `text-title` | 20 / 28 | 600 | Page titles |
| `text-display` | 24 / 32 | 600 | KPI values, dashboard greeting |
| Overline | 12 / 16, 500, `tracking-wide`, uppercase | | **Only** sidebar group labels and KPI labels |

### 3.8 Spacing, radius, borders, elevation, z-index, motion

| Category | Specification |
|---|---|
| Spacing (4px base) | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 |
| Component padding | Card 20 (dense 16) · Dialog 24 · Drawer 24 · Table cell 12×8 (compact 12×6) · Page gutter 24 desktop / 16 mobile · Section gap 24 · Field gap 16 |
| Radius | `sm 4px` badges, checkboxes, chips · `md 6px` buttons, inputs, menu items, nav items · `lg 8px` cards, dialogs, drawers, popovers, toasts · `full` avatars, dots. **No 12/16px radii.** |
| Border width | 1px default · 2px focus outline (2px offset) · 3px nav/insight indicator |
| Elevation | `none`: cards (hairline only) · `xs` `0 1px 2px rgb(16 24 40/.05)`: sticky headers, toolbars · `md` `0 4px 12px rgb(16 24 40/.08)`: menus, popovers, toasts · `lg` `0 16px 40px rgb(16 24 40/.14)`: dialogs, drawers |
| Z-index | base 0 · sticky 10 · sidebar 20 · topbar 30 · dropdown 40 · overlay 50 · modal/drawer 60 · toast 70 · tooltip 80 |
| Motion | 120ms hover/press · 160ms menus, tabs, nav · 200ms dialogs, drawers (`ease-out`; exit 0.75×). No scale/bounce. All motion disabled under `prefers-reduced-motion`. |

### 3.9 Layout & breakpoints

| Token | Value |
|---|---|
| Sidebar | 248px expanded · 56px collapsed · off-canvas sheet below `lg` |
| Top bar | 56px |
| Content max-width | 1440px lists/dashboards · 1120px settings · 880px forms |
| Breakpoints | `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536` (Tailwind defaults, unchanged) |
| Density | `compact` (row 36, control 32), default for tables · `comfortable` (row 44, control 40), default for forms. Set via `data-density` on `<html>` or per table. |
| Touch | Interactive targets ≥44px on `pointer: coarse` (already supported by `Button`) |

### 3.10 Interaction states (all components)

| State | Rule |
|---|---|
| Hover | One background step (`surface-hover`, `primary-hover`, `sidebar-hover-bg`). Never shadow growth. |
| Pressed | Same as hover; no scale transform |
| Selected | `primary-tint` bg + `primary` indicator/text |
| Focus | 2px `primary` outline, 2px offset, `focus-visible` only. On navy: `#8FA8F0`. |
| Disabled | `text-muted` text, `surface-subtle` bg, `not-allowed` cursor; tooltip explaining why where useful |
| Invalid | `error-icon` border + `error-text` message + icon (not colour alone) |
| Read-only | `surface-subtle` bg, `border` hairline, text stays `text-primary` |
| Loading | Skeleton after 150ms; buttons keep width and show spinner |

---

## 4. Contrast verification & required decisions

Every foreground/background pair was computed with the WCAG 2.x relative-luminance formula. Thresholds: **4.5:1** normal text, **3:1** large text (≥18.66px bold / 24px) and UI components/graphics (1.4.11).

### 4.1 Passing combinations

| Pair | Ratio | |
|---|---|---|
| White on Primary `#3157D5` | 6.08 | ✅ |
| White on Primary Hover `#2447B8` | 7.87 | ✅ |
| Primary on White / Canvas / Subtle / Tint | 6.08 / 5.81 / 5.55 / 5.43 | ✅ links & selected text everywhere |
| Text Primary on White / Canvas / Subtle / Tint | 14.70 / 14.05 / 13.42 / 13.13 | ✅ |
| Text Secondary on White / Canvas | 4.97 / 4.75 | ✅ |
| Text Secondary on Subtle `#F1F5F9` | 4.54 | ✅ (narrow margin) |
| Sidebar text on navy / hover / active bg | 9.27 / 7.57 / 6.99 | ✅ |
| White on active bg `#22385A` | 11.79 | ✅ |
| Indicator `#8FA8F0` on navy / active bg | 6.72 / 5.07 | ✅ |
| Muted `#94A3B8` on navy (group labels) | 6.10 | ✅ |
| Success text on bg / white | 6.49 / 7.13 | ✅ |
| Warning text on bg / white | 4.51 / 5.02 | ✅ (on bg: narrow margin) |
| Error text on bg / white | 5.38 / 6.57 | ✅ |
| Info text on bg / white | 4.84 / 5.91 | ✅ |
| Success / Error / Info icons on own bg | 4.57 / 3.32 / 3.60 | ✅ (≥3:1 graphics) |
| Teal on White / Canvas / `ai-tint` | 5.47 / 5.23 / 5.25 | ✅ |
| White on Teal | 5.47 | ✅ (not used on buttons per direction) |

### 4.2 Failing combinations, with proposed resolutions

| ID | Mandated value | Problem | Ratio | Proposed resolution (needs approval) |
|---|---|---|---|---|
| **D1** | Muted text `#94A3B8` | Fails as readable text on all light surfaces | 2.56 (white), 2.45 (canvas), 2.34 (subtle) | Restrict `text-muted` to **disabled text** (WCAG-exempt), decorative icons, and the navy sidebar (6.10). **Placeholders use `text-secondary`.** |
| **D2** | Input border `#CBD5E1` | Text-input boundaries below 3:1 (1.4.11) | 1.48 | **(a, recommended)** Add ◆ `input-border` `#8A94A6` (3.06) for text-entry controls at rest; keep `#CBD5E1` for hover-on-secondary, dividers and disabled borders. **(b)** Keep `#CBD5E1` and accept non-conformance (common in the industry, not AA-compliant). |
| **D3** | Error `#DC4C4C` as a filled button | White text on it fails | 4.05 | Filled destructive buttons use **`#B42318`** (6.57), hover ◆ `#912018`. `#DC4C4C` stays the icon/indicator colour. |
| **D4** | Warning icon `#D97706` on Warning bg `#FEF3C7` | Graphic below 3:1 | 2.86 | Icons inside warning badges/alerts use **`#B45309`** (4.51). `#D97706` is used for icons on white (3.19) only. |
| **D5** | Text Secondary `#667085` on Primary Tint `#EEF2FD` | Fails in selected rows/items | 4.44 | In selected rows, secondary text switches to ◆ `#475467` (passes on tint), or stays `text-primary` |
| **D6** | Icons in status colours on white: Warning `#D97706` / Error `#DC4C4C` / Info `#3478D4` used as **text** | Fail as small text | 3.19 / 4.05 / 4.39 | Already handled by the separate Text column. **Enforced by token naming** (`*-icon` vs `*-text`), so text can't accidentally use icon shades. |

Not failures: hairline `#E2E8F0` (1.23) and secondary-button border `#D0D5DD` (1.47) are acceptable because cards are identified by content and buttons by their text label. Neither is the sole cue for a control boundary.

---

## 5. Proposed theme architecture

### 5.1 Three tiers

```
Tier 1  PRIMITIVES       raw palette, no utilities generated, never used in components
        --ino-blue-600: #3157D5; --ino-navy-900: #14243A; --ino-slate-50: #F8FAFC; …
           │
Tier 2  SEMANTIC          what the colour MEANS: Tailwind utilities, used by every component
        --color-primary, --color-canvas, --color-surface, --color-text-secondary,
        --color-success-text, --color-ai, …
           │
Tier 3  COMPONENT         only where a component needs its own knob
        --color-sidebar-*, --color-table-*, --color-chart-*, --color-input-border
```

- **Themes override Tier 2/3 only.** `[data-theme="dark"]`, a future high-contrast theme, or a tenant brand override (primary only) is a small block of variable reassignments, with zero component changes.
- **Tier 1 lives in plain `:root` custom properties** (not `@theme`), so Tailwind doesn't generate `bg-ino-blue-600` utilities and developers can't bypass semantics.

### 5.2 Where it lives (no new files beyond one primitives sheet)

| File | Role |
|---|---|
| `packages/ui/tailwind/primitives.css` *(new)* | Tier 1 `:root { --ino-* }` |
| `packages/ui/tailwind/theme.css` | Tier 2 + 3 in `@theme default`, re-pointed to `var(--ino-*)`; existing names kept, new names added |
| `packages/ui/tailwind/dark.css` | Dark Tier 2/3 overrides (later phase) |
| `apps/web-app/src/styles.css` | Imports + app-only overrides (e.g. stage the palette before promoting to library defaults) |

### 5.3 Mapping existing library tokens (keeps components working)

| Existing token | New value | Notes |
|---|---|---|
| `background` | `#FFFFFF` (surface) | **Kept white**: the library uses `bg-background` 23× for control surfaces (inputs, outline buttons, switches, tabs, toast, top bar). Changing it to the canvas grey would grey every input. |
| ◆ `canvas` *(new)* | `#F8FAFC` | Applied to `body` and shell content area |
| `card`, `popover` | `#FFFFFF` | |
| `foreground`, `card-foreground`, `popover-foreground` | `#1D2939` | |
| `muted` | `#F1F5F9` | surface-subtle |
| `muted-foreground` | `#667085` | text-secondary (**not** `#94A3B8`, per D1) |
| ◆ `text-muted` *(new)* | `#94A3B8` | disabled/decorative only |
| `accent` / `accent-foreground` | `#F1F5F9` / `#1D2939` | hover highlight |
| `secondary` / `secondary-hover` / `secondary-foreground` | `#FFFFFF` / `#F8FAFC` / `#1D2939` | plus ◆ `secondary-border #D0D5DD`; `Button secondary` variant gains a border |
| `primary` / `primary-hover` / `primary-foreground` | `#3157D5` / `#2447B8` / `#FFFFFF` | |
| ◆ `primary-tint` | `#EEF2FD` | |
| `destructive` / `destructive-hover` / `destructive-foreground` | `#B42318` / `#912018` / `#FFFFFF` | D3 |
| `success`, `warning`, `info` | icon shades | plus ◆ `*-text`, `*-bg`, and `error-icon/-text/-bg` |
| `border` / `input` / `ring` | `#E2E8F0` / `#8A94A6` or `#CBD5E1` (D2) / `#3157D5` | |
| `chart-1…6` | §3.6 | `chart-7/8` removed |
| `sidebar` | `#14243A` | |
| `sidebar-foreground` / `-muted-foreground` | `#C0C8D4` / `#94A3B8` | |
| `sidebar-accent` / `-accent-foreground` | `#1E3350` / `#FFFFFF` | hover |
| `sidebar-primary-soft` | `#22385A` | active bg |
| `sidebar-primary` / `sidebar-ring` | `#8FA8F0` | indicator / focus |
| `sidebar-border` | `rgb(255 255 255/.08)` | |
| `overlay` | `rgb(20 36 58/.48)` | |

### 5.4 Library component edits required (small, contained)

| Component | Change | Reason |
|---|---|---|
| `Button` | `secondary` = white + `secondary-border`; `destructive` uses new value; remove `size="icon-*"` misuse at call sites | Approved secondary spec |
| `Badge` | Variants `success/warning/error/info/neutral` = `*-bg` + `*-text` + `*-icon` dot; `ai` variant | Separate icon/text/bg |
| `Alert`, `Toast` | Same triad; 3px left rule in `*-icon` | Status consistency |
| `Card` | No default shadow; `lg` radius; hairline | Quiet surfaces |
| `Input`, `Select`, `Combobox`, `Textarea`, `NumberField`, `DatePicker` | Border `input-border`; placeholder `text-secondary`; disabled `surface-subtle` | D1/D2 |
| `DataTable` | Header `surface-subtle`; row hover `surface-hover`; selected `primary-tint` + 3px left indicator; numeric align prop; density prop; bulk-action slot; loading/empty/error rows | Tables standard |
| `MetricCard` | Delta = icon + text in `*-text`; tabular value | 1.4.1 |
| `Sidebar` | Active item indicator bar; group label style | Navy sidebar |
| ◆ `InsightCard` *(new widget)* | Teal AI pattern (§7.3) | Teal role |
| ◆ `FilterBar` *(new)* | Composition of SearchInput + chips + Popover | List pages |

### 5.5 Enforcement (so it stays clean)

1. **CI guard** (`scripts/checks/check-design-tokens.mjs`, alongside the existing `check-ts-boundaries.mjs`): fail on raw palette classes, `text-[Npx]`, `bg-gradient`/`bg-linear`, `rounded-(xl|2xl|3xl)`, translucent surface tints (`bg-card/`, `bg-background/`), and emoji in `apps|kernel|modules|plugins` source.
2. **Optional hard stop (Phase G):** in `apps/web-app/src/styles.css`, `@theme { --color-*: initial; … }` re-declares only semantic tokens, so raw `bg-blue-500` utilities stop existing in the app build. Library defaults must first be fully literal/primitive-based.
3. `docs/design-system/README.md`: usage guide (the empty folder today is a root cause of drift).

### 5.7 One system, three surfaces (consistency model)

Product, website and docs are **three surfaces of one design system**, built from the same pieces in four layers:

```
Layer 1  TOKENS       @innostes/ui/tailwind (primitives → semantic → component)
                      The approved brand colours, type, spacing, radius, elevation, motion. Defined ONCE.
Layer 2  COMPONENTS   @innostes/ui: Button, Input, Select, Badge, Card, Table/DataTable, Tabs,
                      Dialog, Sheet, Toast, Tooltip, Sidebar, TopBar, PageHeader, MetricCard, …
Layer 3  PATTERNS     Compositions of components: FilterBar, StatusBadge, InsightCard, EmptyState,
                      Brand lockup (Logo), Screenshot frame, CTA band, Feature grid, Pricing tier
Layer 4  TEMPLATES    Product: Dashboard · List · Detail · Form · Settings · Report
                      Website: Home · Module page · Pricing/Services · Docs page
```

| Rule | What it means in practice |
|---|---|
| **Single source of truth** | Colours exist only in `packages/ui/tailwind`. `apps/web-app`, `apps/landing` and the Fumadocs chrome **map to** these tokens and never define their own (`brand-*`, `fd-*` literals and app-level palettes are removed). |
| **Brand colours are fixed** | No surface, module, page or campaign may introduce a new hue or re-tint the approved ones. Changes happen once in the token file and apply everywhere. |
| **Build from pieces** | A page may only use Layer 2–4 pieces plus layout utilities (flex/grid/spacing). If a piece is missing, it's added to the shared layer first, then used, never hand-built inline. |
| **Same piece, same look** | A button, badge, card, table, form field or dialog looks and behaves the same in the product, on the website and in the docs. The website may use larger **sizes** (display type, section spacing), never different **styles**. |
| **Patterns are shared too** | Website blocks (Hero, Feature grid, CTA band, Logo strip, Pricing tier, Comparison table, Screenshot frame) are composed from `@innostes/ui` components and live in one place (`apps/landing/components/blocks`, or `@innostes/ui/marketing` if reused elsewhere). |
| **Enforced, not hoped for** | The CI guard (§5.5) runs on all three surfaces. Visual baselines exist for every shared piece. |

**Consistency checklist for any new screen or page:**
1. Uses only semantic tokens (no hex, no raw palette classes).
2. Uses existing components/patterns, with no restyling via `className` beyond layout.
3. Follows a template.
4. Has one primary (Executive Blue) action.
5. Uses status colours only for status and teal only for AI/insight.
6. Uses the shared Logo piece.

### 5.6 Dark theme (supported, secondary; delivered last)

Navy-based rather than zinc, so the brand stays recognisable:

| Token | Dark value | Check |
|---|---|---|
| canvas / surface / surface-subtle | `#0B1524` / `#111E31` / `#172840` | |
| text-primary / text-secondary | `#E6EAF0` / `#98A2B3` | 13.87 / 6.50 on surface ✅ |
| primary (text/links) | `#8FA8F0` | 7.20 ✅ |
| primary (button bg) | `#3157D5` with white text | 6.08 ✅ |
| border | `rgb(255 255 255/.08)` | |
| success / warning / error / info text | `#4ADE80` / `#FBBF24` / `#F87171` / `#60A5FA` | 9.61 / 10.03 / 6.05 / 6.59 ✅ |
| ai | `#5EC4B6` | 8.01 ✅ |

---

## 6. Application shell redesign

### 6.1 Structure

```
┌────────────────────┬──────────────────────────────────────────────────────────────┐
│ ▣ INNOSTES         │  ☰   PeopleOps  /  Leave            [ Search…  Ctrl K ]  🔔  ?  ◐  (AR) │  56px white, hairline bottom
│   Business OS      ├──────────────────────────────────────────────────────────────┤
│────────────────────│  Leave requests                       [Export]  [+ New request] │  PageHeader
│ ⌂  Home            │  12 pending · FY 2026-27                                       │
│                    │  ───────────────────────────────────────────────────────────── │
│ MODULES            │  [Search…] [Status ▾] [Type ▾] [+ Filter]        Saved views ▾ │  FilterBar
│ ▾ 👥 PeopleOps     │  ┌──────────────────────────────────────────────────────────┐ │
│     Dashboard      │  │ ☐ Employee        Type      From      To     Days  Status │ │  DataTable
│     Employees      │  │ ☐ …                                                       │ │  on white surface
│  ▌  Leave          │  └──────────────────────────────────────────────────────────┘ │
│     Attendance     │  1–25 of 132                               ‹ 1 2 3 … 6 ›       │
│ ▸ 💼 SalesFlow     │                                                                │
│                    │                                    canvas #F8FAFC              │
│ TOOLS              │                                                                │
│    Tracura         │                                                                │
│ ADMINISTRATION     │                                                                │
│    Audit trail     │                                                                │
│    API keys        │                                                                │
│────────────────────│                                                                │
│ [N] Northwind  ⌄   │  ← org switcher                                                │
│ «  Collapse        │                                                                │
└────────────────────┴──────────────────────────────────────────────────────────────┘
 #14243A solid navy                 (icons shown as glyphs here; Lucide icons in product)
```

### 6.2 Sidebar specification

| Element | Spec |
|---|---|
| Container | 248px, `#14243A` solid, right border `sidebar-border`; collapses to 56px icon rail (tooltips on items); sheet below `lg` |
| Brand lockup | 56px tall (aligns with top bar). Logo mark (white) + "INNOSTES" 14/600 white + "Business OS" 12/400 `#94A3B8` |
| Group label | Overline 12/500 `#94A3B8`, 16px top spacing, not interactive |
| Item | 36px, radius 6, 12px horizontal padding, icon 16px + label 13/500 `#C0C8D4` |
| Hover | bg `#1E3350`, text white |
| Active | bg `#22385A`, text `#FFFFFF`, 3px `#8FA8F0` left bar inset, icon `#8FA8F0`, `aria-current="page"` |
| Module section | Expand/collapse (chevron), auto-expanded for the current module; sub-items indented 28px, 32px tall |
| Inactive module | Shown with a lock/"Activate" affordance for admins; hidden for others |
| Focus | 2px `#8FA8F0` outline |
| Footer | Org switcher (`DropdownMenu`: tenant list, settings), collapse toggle |
| Removed | Bookmarks/Recent (until implemented), version footer, "Business Module" card |

### 6.3 Top bar specification

| Element | Spec |
|---|---|
| Container | 56px, `#FFFFFF` solid (no blur/translucency), bottom hairline `#E2E8F0`, z 30 |
| Start | Sidebar toggle · Breadcrumbs (real `href`s, last item `aria-current`, truncates middle items on small screens) |
| Center/End | Global search (`SearchInput` opening `CommandPalette`, Ctrl/⌘K): modules, sub-pages, admin pages, later records |
| End | Notifications (real data or hidden) · Help (env URL) · Theme toggle (persisted; hidden until dark parity if decided) · User menu (profile, preferences, sign out, sign out everywhere) |
| Mobile | Toggle · current page title · search icon · user avatar |

### 6.4 Routing changes (behaviour preserved)

- `/modules/:moduleId/:page?` and `/plugins/:pluginId/:page?`, implemented by extending `NavigationContext` with `matchPath`/`useRouteParams` (≈50 lines, unit-tested, no new dependency).
- On navigate: update `document.title` ("Leave · PeopleOps · INNOSTES"), move focus to the page `<h1>`, announce via a polite live region.
- Module activation gate (`isModuleActive`/`activateModule`) is preserved as an in-content EmptyState.
- `SkipLink` → `<main id="main">`.

---

## 7. Component colour & transformation plan

### 7.1 Component colour standards

| Component | Rest | Hover | Active / Selected | Focus | Disabled | Error |
|---|---|---|---|---|---|---|
| **Primary button** | bg `#3157D5`, text white | `#2447B8` | `#2447B8` | 2px `#3157D5` ring, 2px offset | 50% opacity | — |
| **Secondary button** | bg white, border `#D0D5DD`, text `#1D2939` | bg `#F8FAFC`, border `#CBD5E1` | same as hover | ring | text `#94A3B8`, bg `#F1F5F9` | — |
| **Ghost / icon button** | transparent, icon `#667085` | bg `#F1F5F9`, icon `#1D2939` | bg `#F1F5F9` | ring | 50% | — |
| **Destructive button** | bg `#B42318`, text white | `#912018` | | ring | 50% | — |
| **Link** | `#3157D5` | underline, `#2447B8` | | ring | | |
| **Input / Textarea** | bg white, border `input-border` (D2), text `#1D2939`, placeholder `#667085` | border `#667085` | border `#3157D5` + ring | 2px ring | bg `#F1F5F9`, text `#94A3B8` | border `#DC4C4C`, message `#B42318` + icon |
| **Select / Dropdown trigger** | as Input + chevron `#667085` | as Input | open: border `#3157D5` | ring | as Input | as Input |
| **Menu / popover** | bg white, hairline, `md` shadow, radius 8 | item bg `#F1F5F9` | checked item: `#3157D5` check | item highlight | text `#94A3B8` | — |
| **Checkbox / Radio** | border `input-border`, bg white | border `#667085` | bg/border `#3157D5`, mark white | ring | `#F1F5F9` | border error |
| **Switch** | track `#CBD5E1` | | track `#3157D5` | ring | 50% | — |
| **Tabs (line)** | text `#667085` | text `#1D2939` | text `#1D2939` 500, 2px `#3157D5` underline | ring | `#94A3B8` | — |
| **Segmented control** | bg `#F1F5F9`, text `#667085` | text `#1D2939` | white pill, text `#1D2939`, xs shadow | ring | | |
| **Sidebar nav** | §6.2 | | | | | |
| **Breadcrumb** | links `#667085`, separators `#94A3B8` | `#1D2939` underline | current `#1D2939` 500 | ring | | |
| **Card** | bg white, 1px `#E2E8F0`, radius 8, no shadow | interactive cards: border `#CBD5E1` | selected: border `#3157D5` + tint | ring | | |
| **Table** | header bg `#F1F5F9`, header text `#667085` 12/500; cells `#1D2939` 13; row lines `#E2E8F0` | row bg `#F8FAFC` | selected row bg `#EEF2FD` + 3px `#3157D5` left bar; secondary text `#475467` (D5) | row focus ring (keyboard) | | error row: `error-bg` left marker |
| **Bulk action bar** | bg `#14243A`, text white, actions as ghost-on-navy | | | `#8FA8F0` ring | | |
| **Pagination** | text `#667085` | bg `#F1F5F9` | current: bg `#EEF2FD`, text `#3157D5` 600 | ring | `#94A3B8` | |
| **Badge (status)** | `*-bg` + `*-text` + `*-icon` dot (warning dot `#B45309`, D4) | — | — | — | — | — |
| **Badge (neutral)** | bg `#F1F5F9`, text `#475467` | | | | | |
| **KPI / MetricCard** | white card; label overline `#667085`; value 24/600 `#1D2939` tabular; delta icon+text `success-text`/`error-text`; neutral delta `#667085` | | | | | |
| **Modal** | surface white, radius 8, `lg` shadow, overlay navy 48%; title 16/600; footer right-aligned: Secondary · Primary | | | focus trapped | | |
| **Drawer (Sheet)** | as Modal, right side, 480/640px, sticky header & footer | | | | | |
| **Toast** | white, hairline, `md` shadow, 3px left rule `*-icon`, title `#1D2939`, body `#667085` | | | | | errors persist |
| **Alert (inline)** | `*-bg`, icon `*-icon` (warning `#B45309`), text `*-text` / `#1D2939` | | | | | |
| **Tooltip** | bg `#14243A`, text white 12, radius 4, 400ms delay | | | | | |
| **Skeleton** | `#F1F5F9` with shimmer to `#E2E8F0` (static if reduced-motion) | | | | | |
| **Spinner / progress** | `#3157D5` on `#E2E8F0` track | | | | | |
| **Empty state** | icon 40px in `#F1F5F9` circle, icon `#667085`; title 16/600; text `#667085`; one primary action | | | | | |
| **Charts** | §3.6 | tooltip as Tooltip | | | | |
| **AI insight** | §7.3 | | | | | |

### 7.2 Status mapping (single source per domain)

| Business state | Status token |
|---|---|
| Approved, Posted, Active, Paid, Completed, Present, 2xx | success |
| Pending, Awaiting approval, Due soon, Draft-with-issues, 4xx | warning |
| Rejected, Overdue, Failed, Terminated, 5xx | error |
| Submitted, In review, Scheduled, Info, 3xx | info |
| Draft, Inactive, Archived, Cancelled | neutral |

### 7.3 AI / intelligence pattern (the only teal surface)

```
┌▌───────────────────────────────────────────────────────────┐
│▌ ✦ Insight                                     ⓘ  Dismiss │   bg #F0FDFA, 3px left rule #0F766E,
│▌ Attrition risk is rising in Engineering (3 of 41).        │   icon #0F766E, label "Insight" #115E59 12/600,
│▌ Based on leave patterns over the last 90 days.            │   body #1D2939, provenance #667085
│▌ [View employees]                                          │   action = secondary button (not teal)
└────────────────────────────────────────────────────────────┘
```

Rules: always show provenance ("Based on…"); never use teal for buttons; at most one insight block per dashboard section; a small "New" dot in teal for new features, auto-expiring.

### 7.4 Transformation actions by component

| From (today) | To | Count / scope |
|---|---|---|
| Hand-built KPI `Card`s | `MetricCard` | ~25 |
| Gradient hero banners | `PageHeader` | 8 files |
| Custom activity rows | `ActivityFeed` / `EntityList` | all dashboards |
| `Table` + raw `<th>` / custom lists | `DataTable` + `FilterBar` + `Pagination` | AuditTrail, ApiKeys, Expenses, Tracura logs, PeopleOps lists |
| Raw `<input>/<select>/<textarea>` | `Field` + `Input`/`Select`/`Textarea`/`DatePicker`/`FileDropzone` | Expenses, Tracura, Masters |
| `<Dialog>` without content | `Dialog` + `DialogContent/Header/Footer` | Expenses (bug) |
| Confirm-less destructive actions | `AlertDialog` | Revoke key, delete project, offboarding |
| Custom status badge maps | `Badge` semantic + `StatusBadge` map | Tracura, AuditTrail, dashboards |
| `tone="chart-N"` identity tiles | Neutral `IconTile` | 41 |
| Icon-only buttons | + `Tooltip` | shell, tables |
| Translucent `bg-*/NN` surfaces | Solid tokens | 254 |

---

## 8. Page templates

| Template | Structure |
|---|---|
| **Dashboard** | PageHeader (greeting/date or module name; ≤1 primary + 1 secondary) → KPI row (MetricCard ×4; `1 → sm:2 → xl:4`) → "Needs attention" ActionList → 2/3 + 1/3 grid (chart · activity / insight). No hero, no illustration. |
| **List** | PageHeader (title, count, primary "New") → FilterBar → DataTable (bulk bar on selection) → Pagination. Row click → Sheet quick-view or Detail page. |
| **Detail** | PageHeader (record name, status Badge, key facts, actions menu) → Tabs (Overview · related lists · Activity/Audit) → 2-col (main 2/3, facts 1/3). |
| **Form** | `FormLayout` sections (title + description left on ≥lg, fields right) → sticky footer (Cancel · Save draft · Submit) → unsaved-changes guard. Max 880px. |
| **Settings** | Vertical sub-nav (Tabs on mobile) + sectioned cards, per-section Save. Max 1120px. |
| **Report** | PageHeader + parameter bar (date range, dimensions) → chart → DataTable → Export (secondary). |

---

## 9. Module-wise transformation matrix

| Module / Area | Existing pages | Main UI issues (vs. final direction) | Shared components / templates | Raw colours | Priority |
|---|---|---|---|---|---|
| **App shell** | Ecosystem shell, Module shell, Plugin shell, TopHeader, SidebarNav | 3 shells; white sidebar; dead items; fake search; placeholder data; non-URL sub-pages; translucent top bar | Sidebar (navy), TopBar, Breadcrumb, CommandPalette, UserMenu, DropdownMenu (org), SkipLink, Tooltip | 3 | **P0** |
| **PeopleOps (HRMS)** | Dashboard, Employees, Attendance, Leave, Payroll, Expenses, Offboarding, Masters (+ unused `PeopleOpsPage`) | Duplicate app vs module implementation; emerald identity; broken Expenses dialog & raw inputs; 30 TS errors in Offboarding; `animate-pulse` | Dashboard/List/Form/Detail templates, DataTable, FormLayout, DatePicker, FileDropzone, MetricCard, ActionList (approvals), StatusBadge, AlertDialog | 19 | **P0**: real backend, most usage |
| **Administration** | ApiKeysManager, AuditTrailPage | 69 raw colours; translucent cards; no sort/pagination; Select type errors; revoke without confirm | List template, DataTable, FilterBar, Sheet (event detail), AlertDialog, Skeleton | 71 | **P1** |
| **Tracura (plugin)** | Overview, Logs + inspector, API keys, Projects, Settings (8 sub-tabs), Integrations | Own sidebar & branding; 2,887-line file; 253 raw colours; purple/rose/amber/emerald code badges; native selects; non-responsive 3-pane | Global nav contribution, SplitPane, DataTable, Select, Tabs, Sheet, StatusBadge (HTTP map §7.2), code block | 253 | **P1** |
| **Ecosystem Home** | Home | Mountain illustration, WelcomeBanner, fake activity/favourites, "Arun" | Dashboard template, MetricCard, ActivityFeed, ActionList, InsightCard (if real) | 12 | **P1** |
| **SalesFlow (CRM)** | Dashboard (+ unused `SalesFlowPage`), 7 stub pages | Violet identity, gradient, emoji, mock KPIs, stub banner | Dashboard template, KanbanBoard (deals), DataTable, charts | 11 | P1 |
| **Modules & Plugins catalog** | ModulesManagerPage, PluginsManagerPage | `rounded-xl` shadowed cards; per-item tone colours | Interactive Card, Badge, EmptyState, AlertDialog (deactivate) | 0 (tones) | P2 |
| **Kernel – Auth** | Login, Forgot, Reset, Must-change password | Correct form usage; wrong branding; `rounded-2xl shadow-xl` | Brand lockup, Card (`lg`), Alert | 0 | P2 |
| **Kernel – Setup** | SetupGate, SetupLoader, SetupWizard (1,059 lines) | Gradient loader; emoji; 5 raw colours | Stepper, FormLayout, brand lockup, Progress | 5 | P2 |
| **LedgerFlow (Finance)** | Dashboard, 7 stubs | Blue identity; gradient; emoji; ± amounts colour-only; jargon | Dashboard template, DataTable (right-aligned tabular currency, sign + colour), MetricCard, charts | 23 | P2 (no backend) |
| **StockFlow (Inventory)** | Dashboard, 6 stubs | Same template issues | Same | 14 | P2 |
| **HireFlow (ATS)** | Dashboard, 7 stubs | Amber identity collides with Warning | KanbanBoard, DataTable, Dashboard template | 15 | P3 |
| **SprintFlow** | Dashboard, 6 stubs | 21 raw colours | KanbanBoard, DataTable | 21 | P3 |
| **DocFlow** | Dashboard, 5 stubs | 5 emoji | TreeView, List template, editor | 16 | P3 |

**Module identity rule:** icon + name in the sidebar, breadcrumb and page header. No module colours anywhere.

---

## 10. Implementation roadmap

Each phase ships independently, preserves business logic and API calls, and ends with a report (changed files, design decisions, test results, open issues).

### Phase 0 — Hygiene (prerequisite)
- **Files:** `TopHeader.tsx`, `AuditTrailPage.tsx`, `PluginsContext.tsx`, `TenantContext.tsx`, `OffboardingTab.tsx`, `TracuraPage.tsx`, `ApiKeysManager.tsx`
- **Changes:** fix 48 type errors (e.g. `size="icon-sm"` → `iconOnly size="sm"`; Select `null` handling); remove 48 unused imports. No visual change.
- **Risk:** Low · **Depends on:** — · **Accept:** `tsc` = 0 errors; build + `arch-check` green.

### Phase A — Token foundation
- **Files:** `packages/ui/tailwind/primitives.css` (new), `theme.css`, `apps/web-app/src/styles.css`, `apps/web-app/index.html` (title, font preload), `apps/web-app/public/fonts/*`; library edits in §5.4 for Button, Badge, Alert, Toast, Card, inputs.
- **Changes:** §3 tokens; §5.3 mapping; Inter; `canvas` on body; reduced-motion rule; `tabular-nums` utility.
- **Also:** map the landing/Fumadocs tokens onto the shared tokens in the same phase (§14.4 steps 1–2), so product, website and docs switch to the one palette together (§5.7, decision Q4).
- **Risk:** Medium. All surfaces shift at once; leftover raw classes will clash until each page is migrated onto shared pieces (expected, temporary).
- **Accept:** library components render in the final palette; every §4 pairing verified in a token sampler page.

### Phase B — Unified shell & navigation
- **Files:** `app.tsx`, `NavigationContext.tsx`, `SidebarNav.tsx`, `TopHeader.tsx`, `catalog-data.ts` + manifests (`icon`); retire `ModuleShellLayout.tsx` / `PluginShellLayout.tsx` shells (keep activation gate); Tracura nav → contribution.
- **Changes:** §6 in full.
- **Architectural impact:** sub-page state moves from `useState` to URL. `PeopleOpsDashboard` already takes `activeSubFeatureId` as a prop, so the change is contained.
- **Risk:** **High** · **Depends on:** A.
- **Accept:** deep link, refresh and Back work for every sub-page; full keyboard operation; sheet nav below `lg`; module activation unchanged.

### Phase C — Shared component hardening
- **Files:** `packages/ui/src`: `DataTable` (density, numeric align, selected style, bulk slot, state rows), `MetricCard`, `PageHeader` (meta/actions slots), new `FilterBar`, `InsightCard`, `StatusBadge`; templates in `packages/ui/src/templates/`; `Tooltip` provider in `main.tsx`; `docs/design-system/README.md`.
- **Risk:** Medium (public API; additive only) · **Depends on:** A.
- **Accept:** tests + docs per component; `publint`/`attw`/bundle-size checks pass.

### Phase D — Core pages
- **Files:** `EcosystemHome.tsx`, `AuditTrailPage.tsx`, `ApiKeysManager.tsx`, `ModulesManagerPage.tsx`, `PluginsManagerPage.tsx`.
- **Changes:** Dashboard/List/Settings templates; remove illustration/hero; real states; AlertDialog for revoke.
- **Risk:** Medium · **Depends on:** B, C.
- **Accept:** CI token guard passes for these files; API calls unchanged (diff-reviewed).

### Phase E — Modules (matrix order)
1. **PeopleOps:** consolidate into `@innostes/peopleops`, delete app duplicate; rebuild Expenses form (fixes dialog); lists → DataTable; approvals ActionList.
2. **Tracura:** mechanical file split first (no behaviour change), then restyle; responsive inspector (Sheet below `lg`).
3. **SalesFlow:** move into module package; KanbanBoard deals.
4. **Ledger / Stock / Hire / Sprint / Doc:** Dashboard template; stub pages → honest "coming soon" EmptyState (per §13 Q5).
- **Risk:** Medium per module, isolated · **Accept per module:** token guard passes; workflows identical; `arch-check` passes.

### Phase F — Responsive
- Verify all templates at 360 / 768 / 1024 / 1280 / 1536; DataTable priority columns + card fallback below `md`; dialogs → full-screen sheet below `sm`; 44px targets on coarse pointers.
- **Risk:** Low–Medium · **Accept:** no horizontal page scroll at 360px; every primary action reachable on mobile.

### Phase H — Landing website & docs (can run in parallel after Phase A; see §14.6)

### Phase G — Accessibility, dark parity & lock-in
- axe on every route; focus order; live regions; dark tokens (§5.6); remove all 60 `dark:` one-offs; enable CI guard repo-wide; optional `--color-*: initial` hard stop.
- **Risk:** Low · **Accept:** zero serious/critical axe violations; guard enforced in CI.

---

## 11. Technical risks

| Risk | Level | Mitigation |
|---|---|---|
| Token change restyles product, website and docs at once (intended, per Q4) | Medium | One reviewed change; visual baselines for all three surfaces re-approved together |
| `background` serves both canvas and controls | Medium | Keep `background` white; add `canvas` (§5.3) |
| Mandated values that fail WCAG (D1–D6) | Medium | Resolutions in §4.2, pending approval |
| Shell unification breaks module activation UX | Medium | Preserve gate as in-content EmptyState; Playwright coverage |
| URL routing without a router library | Medium | Small tested `matchPath` in `NavigationContext`; `react-router` remains an option (new dependency) |
| Moving dashboards into module packages vs `arch-check` boundaries | Low | Direction is allowed (module → ui/kernel); run `pnpm arch-check` per move |
| Re-skinned mock KPIs look "more real" | Medium | Label or replace with empty states (§13 Q5) |
| Tracura single-file refactor | Medium | Split mechanically, then restyle, in separate commits |
| 96 TS errors hide regressions | Medium | Phase 0 first |
| Inter loading (FOUT/CLS) | Low | Self-hosted variable woff2, preload, `swap`, metric-matched fallback |
| Dark mode inconsistent mid-transition | Low | Hide toggle until Phase G, or accept (§13 Q6) |
| Public `@innostes/ui` API changes | Medium | Additive only; changeset + CHANGELOG; React 17/18 compat suites |
| Library token change silently restyles the landing site and fails its visual snapshots (`apps/landing/e2e/visual.spec.ts`) | Medium | Phase H owns the landing re-skin; snapshot baselines updated only after visual review |
| Landing has two token systems (`fd-*` / `brand-*` vs `@innostes/ui`) | Medium | Map `fd-*` onto the shared semantic tokens; delete `brand-*` scale (§14.4) |
| Docs pages state contrast ratios and token values (`contrast-table.tsx`, `token-reference.tsx`, `lib/tokens-data.json`, `theming.mdx`) | Medium | Regenerate from `theme.css`; run `docs-check` |
| Website SEO/conversion regressions from redesign | Medium | Keep URLs, metadata and headings structure; Lighthouse before/after |

---

## 12. Acceptance criteria & regression testing

### 12.1 Global acceptance criteria (definition of done per phase)

- [ ] No raw palette classes, `text-[Npx]`, gradients, `rounded-xl+`, translucent surfaces or emoji in touched files (CI guard)
- [ ] Every colour comes from a semantic/component token
- [ ] All §4 contrast pairs hold; text ≥4.5:1, UI graphics ≥3:1
- [ ] One dominant primary action per view
- [ ] Teal appears only in AI/insight, chart series 2, or "New" indicators
- [ ] No module-specific colours
- [ ] Loading, empty and error states present for every data region
- [ ] Keyboard-operable; visible focus; `aria-current` on nav; titled pages
- [ ] Desktop (1440) and mobile (360) screenshots reviewed against this spec
- [ ] No console errors/warnings on any touched route
- [ ] Existing workflows and API calls unchanged (diff review + E2E)

### 12.2 Regression testing

| Layer | Tooling (all already in repo) | Coverage |
|---|---|---|
| Types | `tsc -p apps/web-app/tsconfig.app.json` | 0 errors, enforced from Phase 0 |
| Architecture | `pnpm arch-check` | Module/kernel/ui boundaries |
| Library units | Vitest (`packages/ui`, `tests/ui-react17`, `tests/ui-react18`) | All changed components; coverage suites stay green |
| Package health | `publint`, `@arethetypeswrong/cli`, `check:size` | Each library change |
| App units | Vitest + Testing Library | Routing (`matchPath`), shell nav, status mapping |
| E2E smoke | Playwright | Setup → login → each module → each sub-page → Back/refresh; module activation; API-key create/revoke; audit filter; expense claim submit; PeopleOps masters CRUD |
| Accessibility | `@axe-core/playwright` | Every route, light (and dark from Phase G); 0 serious/critical |
| Visual | Playwright screenshots | Token sampler + each template at 360/768/1024/1440; diff vs approved baselines |
| Contrast | Token test (script computing ratios from `theme.css`) | Fails CI if any declared pair drops below threshold |
| Manual | Keyboard-only and screen-reader pass (NVDA/VoiceOver) | Shell, one list, one form, one dialog per phase |

---

## 13. Decisions required before Stage 2

| # | Decision | Recommendation |
|---|---|---|
| **Q1** | Product name in UI: "INNOSTES Business OS" everywhere; retire "Ecosystem"? | Yes |
| **Q2** | Single persistent navy sidebar replacing module/plugin shells? | Yes |
| **Q3** | Routing: extend `NavigationContext` vs adopt `react-router` | Extend (no new dependency) |
| **Q4** | ~~Apply tokens in `@innostes/ui` defaults or web-app first?~~ | **Decided:** one palette in `@innostes/ui` defaults, applied to product, website and docs together (§5.7) |
| **Q5** | Modules without backend: keep labelled mock dashboards or "coming soon" empty states? | Coming-soon empty states |
| **Q6** | Dark mode during transition: keep toggle or hide until Phase G? | Hide until parity |
| **Q7** | Font: Inter or Geist? | Inter |
| **D1** | Muted text `#94A3B8` restricted to disabled/decorative/sidebar; placeholders use secondary text | Approve |
| **D2** | Text-input border: `#8A94A6` (AA) vs `#CBD5E1` (as specified, non-conformant) | `#8A94A6` |
| **D3** | Filled destructive button uses `#B42318` | Approve |
| **D4** | Warning icons on warning background use `#B45309` | Approve |
| **D5** | Secondary text in selected rows → `#475467` | Approve |
| **Q8** | Website positioning: "Built for Startups" / "replaces Salesforce, Workday…" vs the enterprise audience in the brief | Product/marketing decision. Visual direction assumes enterprise. |
| **Q9** | Website hero visual: real product screenshots/UI vs current gradient mesh | Real product UI on a solid navy or canvas band |
| **Q10** | Logo files: `innostes-logo-on-light.png` ✅ and `innostes-logo-on-dark.svg` ⚠️ added. The on-dark SVG needs its text converted to outlines and its canvas cropped. No-tagline and symbol-only versions are still needed. | Re-export the SVG with outlined text from the source artwork. Provide no-tagline and symbol-only exports (§14.7). |

**Proposed first increment after approval:** Phase 0 + Phase A, which fixes type errors and lands tokens, Inter and the navy sidebar with no layout changes. It is a low-risk, reviewable baseline that validates the token approach before the higher-risk shell unification (Phase B).

---

## 14. Landing website & documentation

### 14.1 Architecture

| Aspect | Current state |
|---|---|
| Stack | Next.js 16 (App Router) + Fumadocs (MDX docs) + Tailwind v4 + `next-themes` |
| Routes | `(home)`: `/`, `/modules`, `/modules/[slug]`, `/services`, `/ui`, `/plugins/tracura`, `/tracura` · `(docs)`: `/docs` (component library docs, examples), `/dev-docs` (arc42 architecture, guides, operations), `/api-reference` (OpenAPI) · `api/og`, `api/search`, sitemap, robots |
| Content | 363 MDX/content files |
| Styling | `app/global.css` imports Fumadocs `neutral.css` + `preset.css`, then `@innostes/ui/tailwind.css` + `dark.css`, then its own `@theme` (`brand-50…900` = Tailwind blue, `fd-*` chrome tokens, shadows incl. `shadow-glow`) and ~250 lines of custom classes (`gradient-text`, `gradient-cadence`, `hero-mesh`, `site-canvas` grid, `glass-card`, `bento-card`, `section-divider` glow, float/pulse/gradient animations) |
| Font | Inter + JetBrains Mono via `next/font/google`. Inter loads **7 weights (300–900)**. |
| `@innostes/ui` usage | Docs demos/previews render real library components (good: the docs re-skin automatically). Marketing pages import it only 6 times; everything else is hand-styled. |
| Tests | Playwright `e2e/crawl.spec.ts`, `keyboard.spec.ts`, **`visual.spec.ts` + snapshots**; `docs-check` suite (links, prose, demos, coverage, consistency…) |

### 14.2 Audit findings

**Measured in `components/home` + `app/(home)` (6,846 lines):**

| Signal | Count | Consequence |
|---|---|---|
| Raw palette classes | **2,401** (slate 1,298 · blue 300 · emerald 262 · purple 167 · amber 85 · orange 79 · rose 54 · indigo 44 · cyan 34 · violet 32 · teal 18 · zinc 17 · …) | The website ignores all tokens; 15 hue families on the marketing pages |
| `bento-card` (glass, hover lift) | 67 | Glassmorphism + `translateY` hover: trend styling, not enterprise |
| `gradient-cadence` text (orange → rose → violet) | 21 | The primary brand moment is a palette **outside** the approved direction |
| `bg-gradient-*` | 23 | Gradient avatars, glows, badges |
| `hero-mesh` (orange/lavender radial mesh + grid) | 7 | Atmospheric background competes with content |
| `animate-fade-up` / `float` | 30 / 3 | Motion on every section; **0** `prefers-reduced-motion` handling |
| Comments/classes referencing "Cadence-style" | 30 | **The visual identity is modelled on another company's website.** A brand risk, and the opposite of a distinctive identity. |
| `font-extrabold` / `font-bold` | 53 / 135 | Over-weighted headings |
| `rounded-2xl/3xl` + pill buttons (`rounded-full`) | 100+ | Consumer-app softness |
| Arbitrary `text-[Npx]` | 101 | Includes 10–11px text in the hero |
| Emoji | 2 files | `HeroSection`, `ModulePreviewInteractive` |
| Existing logo not used | The approved INNOSTES logo exists but isn't in the repo. `components/logo.tsx` draws a temporary mark ("Placeholder mark… Replace with the real logo", `fill-blue-600`); the web app has only `favicon.ico`. | Brand mark differs between website, app and the real logo |
| Docs component styling | 76 raw palette classes in `components/docs` | Docs chrome is mostly tokenised (good) |

**Qualitative findings:**

| # | Finding | Impact |
|---|---|---|
| W1 | **Two token systems.** Fumadocs `fd-*` (slate/blue-600 `#2563eb`) and `brand-*` (Tailwind blue) sit beside `@innostes/ui` tokens. The docs chrome and the components inside it use different blues. | Website, docs and product never match |
| W2 | **Brand inconsistency with the product.** Website primary `#2563eb` + orange/violet gradient vs product Executive Blue `#3157D5` + navy. Buyers see a different brand from the one they get. | Trust |
| W3 | **Hero CTAs:** three competing actions (white pill, black pill "Get started free", text "Request Assisted Setup"). The primary CTA is **black**, not brand blue. | Weak conversion hierarchy |
| W4 | **Positioning vs. brief:** "Built for Startups", "replaces Salesforce, Workday, QuickBooks, and Jira", "0 Rs" pricing pills. The brief targets large/medium enterprises, CEOs/CFOs/CTOs. | Visual and verbal tone are startup-casual (see Q8) |
| W5 | **Fake social proof:** gradient circles as avatars | Reads as a template; damages credibility with enterprise buyers |
| W6 | **Translucent sticky header** (`bg-white/70 backdrop-blur-xl`), glass cards, glow shadows | Low contrast over the mesh; "AI-generated SaaS" look |
| W7 | **Product previews are hand-drawn mini-mocks** (`HeroSandboxes`, `ModulePreviewInteractive`, 467 lines) with their own colour schemes | They'll drift from the real product; they should be the real product UI |
| W8 | Module pages (`ModuleLandingClient`, `ModulesDirectoryClient`, 977 lines) assign each module its own colour | Same issue as the product |
| W9 | Docs pages hard-code token values and contrast claims (`theming.mdx` shows emerald `#059669` theme examples; `contrast-table.tsx`, `token-reference.tsx`, `lib/tokens-data.json`) | Will be wrong after Phase A unless regenerated |
| W10 | Accessibility: header has good `aria-label`/`aria-expanded` usage. But there is no reduced-motion handling, small text in the hero, and gradient text that can't be reliably contrast-checked. | 1.4.3, 2.3.3 |
| W11 | Performance: 7 Inter weights, multiple full-viewport blurred gradients (`blur-[130px]`), `backdrop-filter` on many cards | Slower LCP/INP on mid-range devices |

### 14.3 Marketing design language (same system, different register)

The website uses the **same palette, tokens and pieces** as the product (§5.7). It differs only in scale and rhythm, never in colours or component styles. Marketing blocks are compositions of `@innostes/ui` components, not hand-styled markup.

| Aspect | Product (app) | Website |
|---|---|---|
| Palette | §3 | **§3, identical.** No orange/violet/pink, no `brand-*` scale |
| Hero / bands | — | Alternate **solid** bands: canvas `#F8FAFC` · white · **Midnight Navy `#14243A`** (one or two per page, e.g. hero or final CTA). Text on navy: white / `#C0C8D4`. |
| Gradients | None | **None** (no mesh, no gradient text, no glow). Option for review only: a single navy→`#1E3350` linear band in the hero (Q9). |
| Typography | Fixed scale 12–24 | Display scale: H1 48/56 (mobile 32/40), H2 36/44 (mobile 28/36), H3 20/28, lead 18/28, body 16/26. Weights 400/500/600 (H1 may use 600 with `-0.02em` tracking). **No 800/900.** |
| Section spacing | 24 | 96 desktop / 64 tablet / 48 mobile |
| Container | 1440 | 1200 content, 720 for prose |
| Buttons | Rectangular, radius 6 | **Same radius 6** (no pills). Primary = Executive Blue. Secondary = white/`#D0D5DD`. Tertiary = text link. **One primary CTA per section.** |
| Cards | Hairline, no shadow | Same; feature cards may use `xs` shadow. No glass, no hover lift. Hover = border `#CBD5E1`. |
| Imagery | — | **Real product screenshots** (rendered from the actual app at 1440px, framed in a neutral device frame with hairline + `lg` shadow) instead of hand-made mocks. Line icons (Lucide) in neutral tiles. No stock gradient avatars. |
| Teal | AI/insight | Same restriction: AI features section and "New" markers only |
| Motion | 120–200ms | One subtle fade-in per section (200ms, no translate > 8px), fully disabled under `prefers-reduced-motion`. No float/pulse/gradient-shift. |
| Social proof | — | Real customer logos (monochrome `#667085`) or none; quantified outcomes; security/compliance badges |
| Docs chrome | — | Fumadocs `fd-*` mapped to product tokens (§14.4): white/canvas surfaces, `#3157D5` links & active nav, navy code-block headers optional |

### 14.4 Token unification for the website

1. **Remove** the `brand-50…900` scale and `shadow-glow` from `app/global.css`.
2. **Map Fumadocs tokens onto the shared semantics** (single source of truth):

| Fumadocs token | → Shared token / value |
|---|---|
| `--color-fd-background` | `canvas` `#F8FAFC` |
| `--color-fd-card`, `-popover` | `surface` `#FFFFFF` |
| `--color-fd-foreground`, `-card-foreground`, `-popover-foreground` | `#1D2939` |
| `--color-fd-muted` / `-muted-foreground` | `#F1F5F9` / `#667085` |
| `--color-fd-border` | `#E2E8F0` |
| `--color-fd-primary` / `-primary-foreground` | `#3157D5` / `#FFFFFF` |
| `--color-fd-secondary` / `-secondary-foreground` | `#F1F5F9` / `#1D2939` |
| `--color-fd-accent` / `-accent-foreground` | `#EEF2FD` / `#2447B8` (7.03 ✅) |
| `--color-fd-ring` | `#3157D5` |
| Dark `.dark` block | §5.6 dark values |

3. **Delete or rewrite** the custom classes: `gradient-text*`, `gradient-cadence`, `hero-mesh`, `glass-card`, `bento-card` (→ `card`), `section-divider::after` glow, `animate-float/pulse-ring/gradient`. Keep `site-canvas` only as a solid `canvas` background (drop the grid, or keep it at ≤4% opacity, pending review).
4. **Fonts:** Inter 400/500/600 only (+ JetBrains Mono 400/500).
5. **Regenerate docs token data** (`lib/tokens-data.json`, `token-reference.tsx`, `contrast-table.tsx`) from `theme.css`. Update `theming.mdx` examples so they show tenant re-branding as an override of the **primary** tier only.
6. **CI guard** (§5.5) extended to `apps/landing/components/home` and `app/(home)`.

### 14.5 Page-wise transformation matrix (website)

| Page / Area | Files | Main issues | Target | Raw colours (approx.) | Priority |
|---|---|---|---|---|---|
| **Global chrome** | `global.css`, `layout.tsx`, `LandingHeader.tsx`, `CompanyFooter.tsx`, `logo.tsx` | Two token systems; translucent header; temporary logo mark; 7 font weights | Token unification (§14.4); solid white header with hairline; **existing INNOSTES logo** in a lockup with "Business OS"; navy footer | header ~60, footer ~70 | **P0** |
| **Home: Hero** | `HeroSection.tsx`, `HeroSandboxes.tsx` | Mesh + glow + gradient text; 3 CTAs, black primary; fake avatars; emoji; 10–11px text | Clear headline (no gradient), lead, **1 primary (blue) + 1 secondary**; real product screenshot; trust row (logos/compliance) | high | **P0** |
| **Home: sections** | `DecoupledUspSection`, `ModuleMatrixSection` (550), `DeveloperFrameworkSection`, `KernelSecuritySection`, `ServicesModelSection`, `ArchitectureComparisonSection`, `CtaSection` | Bento glass cards; per-module colours; heavy weights; per-section animation | Alternating canvas/white bands; neutral feature cards with icon tiles; comparison as a real `Table`; final CTA on a navy band | very high | P1 |
| **Modules directory & module pages** | `ModulesDirectoryClient.tsx` (977), `modules/[slug]/ModuleLandingClient.tsx`, `ModulePreviewInteractive.tsx` | Per-module hues; hand-made previews; emoji | Module identity = icon + name; real screenshots per module; consistent page template (hero · capabilities · workflows · integrations · CTA) | very high | P1 |
| **Tracura product page** | `plugins/tracura/TracuraLandingClient.tsx` (813) | Separate visual identity | Same module page template | high | P2 |
| **Services / pricing** | `services/ServicesPageClient.tsx` (447), `QuoteModal.tsx` | Pill buttons, colourful tiers | Neutral tier cards, one highlighted tier (primary border + tint), quote form with `Field`/`Input`/`Select` | high | P1 |
| **UI library showcase** | `(home)/ui/page.tsx` (488) | Mixed styling | Showcase built entirely from `@innostes/ui` | medium | P2 |
| **Docs: component library** | `(docs)/docs`, `components/docs/*`, `content/docs/**` | Fumadocs blue ≠ product blue; stale token/contrast data | Token mapping; regenerated token & contrast tables; examples rendered in product theme | low (76) | P1 |
| **Docs: dev-docs & API reference** | `content/dev-docs/**`, `(docs)/api-reference` | Inherits Fumadocs chrome | Token mapping only | low | P2 |
| **OG images** | `app/api/og/route.tsx` | Off-brand | Navy background, white wordmark, Executive Blue accent rule | — | P2 |

### 14.6 Phase H — Website & docs roadmap

| Step | Files | Changes | Risk | Acceptance |
|---|---|---|---|---|
| H1 Tokens & chrome | `app/global.css`, `app/layout.tsx`, `LandingHeader.tsx`, `CompanyFooter.tsx`, `logo.tsx` | §14.4 steps 1–4; solid header; navy footer; replace the temporary mark with the existing logo (§14.7) | Medium | Docs and marketing render in the final palette; no `brand-*`/`fd-*` literal colours left |
| H2 Docs data | `lib/tokens-data.json`, `components/docs/{token-reference,contrast-table}.tsx`, `content/docs/theming.mdx` | Regenerate from `theme.css`; update examples | Low | `pnpm nx run landing:docs-check` green; contrast table matches §4 |
| H3 Home page | `components/home/*` | §14.3 language; real screenshots (captured from web-app after Phase D) | Medium | Token guard passes; 1 primary CTA per section; Lighthouse ≥95 accessibility, LCP ≤2.5s |
| H4 Module, Tracura, Services pages | `app/(home)/**` | Shared marketing page template | Medium | Same as H3; URLs & metadata unchanged |
| H5 QA | `e2e/*` | Review and re-baseline `visual.spec.ts` snapshots; keyboard spec; axe | Low | 0 serious/critical axe issues; crawl spec green; new baselines approved |

**Dependencies:** H1–H2 after Phase A (shared tokens). H3–H4 benefit from Phase D/E (real screenshots), but can use interim screenshots. H runs in parallel with B–F.

### 14.7 Brand logo integration (existing logo)

The INNOSTES logo already exists. The work is to use it the same way everywhere. No redesign.

**Added to the repo (asset only, not yet wired into any component):**
Files are named by **the background they're placed on**, so usage is unambiguous:

| File | Logo colours | Use on | Source | Notes |
|---|---|---|---|---|
| `packages/ui/assets/brand/innostes-logo-on-light.png` | Black wordmark + sky-blue symbol | White / canvas / light surfaces (login card, landing header, docs, light top bar) | `https://innostes.com/images/home/section_navbar/company-latest-logo.png` | PNG 1021×257, transparent. SHA-256 `f9fc57c5…7a03`. ✅ Ready to use. |
| `packages/ui/assets/brand/innostes-logo-on-dark.svg` | All white (wordmark, symbol, tagline) | Midnight Navy sidebar, navy footer, OG images | `https://innostes.com/images/home/section_navbar/innostes-logo-white.svg` | SVG, 10 KB. SHA-256 `86b9b8bb…4b66`. Scanned: no scripts, event handlers or external references. ⚠️ **Not production-ready** (see below). |

**Issues with the on-dark SVG (verified by rendering it in headless Chrome):**
1. **The wordmark is live text, not outlines.** "INN", "STES" and the tagline are `<text>` elements in the fonts *Nexa Bold* and *Montserrat*. Browsers don't have Nexa Bold, so the wordmark falls back to a generic serif (Times-like) and **looks nothing like the real logo**. Fix in Inkscape/Illustrator: select the text → *Object to Path* / *Create Outlines*, then re-export.
2. **Square 300×300 canvas** with the logo in the middle third, so roughly 55% empty space. At any fixed height the logo renders small. Fix: crop the viewBox to the artwork bounds (*Resize page to drawing*).
3. **The symbol is white**, not sky blue. That's fine on navy, but confirm it's the intended dark-background version.
4. **Editor leftovers:** Inkscape/Illustrator metadata, unused orange gradient styles (`#F7772D`, `#FFDE43`) and local export paths (`C:\Users\…`). Harmless, but should be stripped (e.g. SVGO) before use.

The files above are kept **exactly as provided**. Fixes 1–2 need the original font/artwork file, so they're for whoever owns the logo source. Fix 4 can be applied during implementation.

| Logo property | Finding |
|---|---|
| Composition | Wordmark "INN◯STES" with a head-and-lightbulb symbol replacing the "O", plus the tagline "we love to innovate" |
| Logo colours | Sky blue **`#00A8EC`** (symbol, tagline) · near-black **`#121212`** (wordmark) |
| On white / canvas | Works as-is. Logos are exempt from WCAG contrast requirements. |
| On Midnight Navy `#14243A` | The on-light PNG's black wordmark disappears (1.21:1), so navy surfaces use `innostes-logo-on-dark.svg` (all white) once its text is outlined. |
| Tagline at small sizes | At a 28px-high lockup the tagline renders ≈5px tall and becomes illegible. Sidebar, top bar and favicon need a **no-tagline version** (and a **symbol-only** version for the 56px collapsed sidebar). |
| Format | Raster PNG. SVG is preferred for crisp scaling and small file size; the PNG works meanwhile at ≤2× its display size. |

**Brand-colour rule:** the logo keeps its own sky blue `#00A8EC` and black. They appear **only inside the logo** and are not added to the UI palette. Executive Blue `#3157D5` stays the single interactive colour. The two blues sit side by side only at the brand lockup, which is a normal and acceptable separation between brand mark and UI colour.

| Need | Detail |
|---|---|
| Source files | ✅ On-light PNG. ⚠️ On-dark SVG (needs outlined text + cropped canvas). **Still needed:** version without tagline (for sidebar/top bar), symbol only (collapsed sidebar, favicon). Ideally all as outlined SVGs. |
| Single source | One shared `Logo` component (in `@innostes/ui` or a small shared brand module) used by web-app sidebar, AuthPage, SetupWizard, landing header/footer, docs chrome and OG image route |
| Replaces | `apps/landing/components/logo.tsx` (temporary mark), "ECOSYSTEM" text block in `SidebarNav.tsx`, lock icon on `AuthPage.tsx`, Tracura's sparkle tile |
| Favicons | `favicon.ico` + SVG favicon + Apple touch icon for both apps, generated from the symbol |
| Colours | The logo keeps its own colours. If they differ from the palette, the logo wins in the mark; the UI palette doesn't change around it. Check the logo's contrast on white and on `#14243A`. |
| Clear space & sizes | Sidebar 24px symbol (collapsed) / lockup at 28px height (expanded); top-left of auth card 32px; landing header 28px |

**Website-specific regression tests:** `pnpm nx run landing:build`, `landing:typecheck`, `landing:docs-check`, `landing:arch-docs-check`, Playwright `crawl` / `keyboard` / `visual` (re-baselined after approval), axe on `/`, `/modules`, `/modules/[slug]`, `/services`, `/docs`, Lighthouse (performance, accessibility, SEO) before/after, and checks that metadata, sitemap and robots output are unchanged.

---

## 15. Implementation status

Implemented on branch `feat/enterprise-design-system` (uncommitted for review). Open decisions were taken with the
recommendations in §13: name "INNOSTES Business OS", one navy sidebar, URL routing on `NavigationContext`, one palette in
`@innostes/ui` for product + website + docs, coming-soon screens for unbuilt module pages, Inter, and D1–D5 approved.

### 15.1 What changed

| Area | Delivered |
|---|---|
| **Tokens** (`packages/ui/tailwind/`) | `primitives.css` (new, tier 1); `theme.css` re-valued to the final palette, plus status triads, `canvas`, `primary-tint`, `ai-*`, `brand-navy`, `strong/subtle-foreground`, `border-strong`, `secondary-border`; weights capped at 600, radii capped at 8px, quiet shadow scale, fixed type scale (`text-caption`, `text-body-sm`), `tabular` utility, global reduced-motion rule; `dark.css` rebuilt navy-based |
| **Library components** | Badge (semantic soft variants + `primary`, `ai`), Button (neutral secondary/outline), Card/WidgetCard/MetricCard/Stat (hairline, no shadow), Table/DataTable (muted header, tint selection, tabular numbers), Input (3:1 border), Alert/Toast (status triad, toast status rule), IconTile, EntityList, Stepper, telemetry charts (tokens + `role="figure"`), Sidebar (active = navy tint + `#8FA8F0` bar), `cn` (registers token font sizes in tailwind-merge) |
| **Brand** | Logo artwork in `packages/ui/assets/brand/` (original PNG + derived on-dark, no-tagline and symbol variants; README). `BrandLogo` in `@innostes/kernel`; `Logo` on the website. Inter self-hosted in web-app (`public/fonts`, OFL). Favicon from the symbol |
| **Shell** (`apps/web-app`) | One persistent navy `AppSidebar` (module pages inline, Tools, Administration, keyboard-operable org switcher); `TopHeader` (real breadcrumbs, Ctrl/⌘K `CommandPalette`, persisted theme, no placeholder data); `ModuleShellLayout`, `PluginShellLayout` and `SidebarNav` removed; URL routes `/modules/:id/:page`, `/plugins/:id/:page`, legacy admin URLs kept; `document.title`, focus to `<main>`, `SkipLink`, 404 page |
| **Pages** | Home rebuilt on real data only; Modules and Plugins share `CatalogPage` (deactivate confirms); Audit trail on the real `/audit/logs` API (server filters + pagination, `DataTable`, detail drawer, CSV/JSON export); API keys (`DataTable`, `AlertDialog` revoke, `Field` form, configured API URL in examples) |
| **Modules** | Six preview dashboards: `ModulePageHeader` with a "Preview · sample data" label, disabled placeholder actions. PeopleOps: shared headers, Expenses wired to `/peopleops/expenses/*`, Offboarding rewritten on the real API with an itemised settlement drawer, Payroll `MetricCard`s. All PeopleOps calls authenticated (`api.ts`) |
| **Tracura** | Inside the shell; its panel is a light secondary panel (hidden below `lg`, where the global sidebar gives its sections); sections are URL-driven |
| **Website & docs** (`apps/landing`) | One token system (Fumadocs `fd-*` mapped to shared tokens; `brand-*` removed); gradients, glass, mesh and glow retired; Inter 3 weights; hero rebuilt (1 primary + 1 secondary + link); all pill CTAs normalised to shared buttons; real logo; token/contrast docs data regenerated |
| **Codemod** | ~2,900 raw palette classes, 254 translucent tints, 300+ sub-12px sizes, gradients, 28 emoji and ~950 `dark:` one-offs replaced across app, kernel, modules, plugin and website |
| **Guards** | `scripts/checks/check-design-tokens.mjs` + `packages/ui/scripts/generate-token-data.mjs --check` (28 contrast pairs, light + dark) as `pnpm run design-check`, added to CI. Docs: `docs/design-system/README.md` |

### 15.2 Defects found and fixed along the way

| Defect | Fix |
|---|---|
| Tailwind `@source` globs for `modules/*` and `plugins/*` matched nothing, so module/plugin-only classes were never generated (e.g. Tracura's input padding) | Directory sources in `apps/web-app/src/styles.css` |
| `PeopleOpsDashboard` returned before its hooks ran, so switching between sub-pages crashed React ("rendered more hooks") | Split into a router plus `PeopleOpsHome` |
| `OffboardingTab` crashed on render (`LoadingSpinner`, `Table.Header` don't exist), sent no auth token, and showed invented data on error | Rewritten |
| Expenses: `<Dialog>` without `DialogContent`; "Submit" reloaded the page | Rewritten and wired to the API |
| Audit trail fetched `/audit/logs` from the web-app origin and always showed sample records | Uses the authenticated API client |
| Tracura: fallback fetch sent bodies as `[object Object]`; inspector crashed with no logs | Body JSON-encoded; empty state |
| Payroll: `<button>` nested in `DialogTrigger`; breadcrumbs nested `<li>` in `<li>` | Fixed |
| Dark theme: links 2.76:1, destructive button 4.05:1, input border 2.51:1 (found by the new contrast guard) | Dark tokens corrected |
| 96 TypeScript errors in `apps/web-app` | **0** |

### 15.3 Verification

| Check | Result |
|---|---|
| `tsc -p apps/web-app/tsconfig.app.json` | 0 errors (was 96) |
| `tsc -p apps/landing/tsconfig.json` | 0 errors |
| `@innostes/ui` unit tests | 249 / 249 (+2 new for `cn`) |
| React 17 / React 18 compatibility suites | 221 / 221 each |
| Web-app routing tests (new) | 5 / 5 |
| `pnpm run arch-check` | All TS and Python boundaries kept |
| `pnpm run design-check` | 101 files clean; 28 contrast pairs pass in light and dark |
| `@innostes/ui` build + bundle-size budgets | Pass |
| web-app production build | Pass |
| axe-core (WCAG 2.2 AA), 26 pages: shell, every module page, Tracura, admin, 404, login, website home / modules / services / Tracura | **0 serious or critical** |
| Visual review | Desktop 1440, mobile 390, dark mode |

### 15.4 Open items

1. **Restart running dev servers.** The web-app dev server kept serving a stale compiled Tracura module after edits; a restart picks up everything (including the Tailwind source fix).
2. **Website visual snapshots** (`apps/landing/e2e/visual.spec.ts`) will differ by design. Re-baseline after visual sign-off.
3. **Logo:** derived PNGs are used. Please supply an SVG with **outlined** text (the supplied white SVG uses live *Nexa Bold* text).
4. **Content decisions still yours:** website positioning (Q8) and the "Trusted by 3,200+" claim (verify or remove).
5. **Sample data:** preview dashboards and the PeopleOps home are clearly labelled but still illustrative; the HR balances/approvals and Payroll KPIs need APIs.
6. **Tracura** is still one ~2,900-line file with native selects (labelled, accessible); splitting it is a follow-up. Project/environment pickers are hidden below `lg`.
7. **Not yet built** from §5.4/§7: `InsightCard` (no AI features exist yet), bulk-action bar, saved views and density toggle on `DataTable`, page templates as library exports (`PageContainer`/`ModulePageHeader` currently live in web-app).
8. Expense receipts send only the file name (no storage endpoint exists yet).
9. Pre-existing docs-check failures unrelated to this work: one broken docs link, API schema pages, and undocumented telemetry chart props.

---

### Appendix A — Evidence commands

```bash
APP="apps/web-app/src kernel/frontend/src modules/*/frontend/src plugins/*/frontend/src"
npx tsc --noEmit -p apps/web-app/tsconfig.app.json                       # 96 errors
grep -rEoh '(bg|text|border|from|via|to|ring|fill|stroke)-(blue|emerald|amber|red|rose|violet|indigo|sky|cyan|green|orange|purple|slate|zinc|gray|teal|yellow|pink)-[0-9]{2,3}' $APP | wc -l   # 462
grep -rEo '(bg|border|text)-(primary|muted|card|background|border|sidebar-accent)/[0-9]+' $APP | wc -l  # 254
grep -rEo 'text-\[[0-9]+px\]' $APP | wc -l                                 # 206
grep -rEo 'bg-background' packages/ui/src --include=*.ts --include=*.tsx | grep -v test | wc -l   # 23
```

### Appendix B — Files inspected

`apps/web-app/{index.html, src/main.tsx, src/styles.css, src/app/**}`, `packages/ui/{tailwind/*.css, src/index.ts, src/lib/*, src/components/**, src/widgets/**}`, `kernel/frontend/src/{auth,setup,core}/**`, `modules/peopleops/frontend/src/**`, `modules/salesflow/frontend/src/**`, `plugins/tracura/frontend/src/**`.
