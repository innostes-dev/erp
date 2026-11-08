# INNOSTES design system: how to build UI

One palette, one set of pieces, everywhere: the product (`apps/web-app`), modules, plugins, the website and the docs.
Rationale and full specification: [`docs/ui-ux/ENTERPRISE_UI_AUDIT.md`](../ui-ux/ENTERPRISE_UI_AUDIT.md).

## 1. Colours: semantic tokens only

Tokens live in `packages/ui/tailwind/` (`primitives.css`, then `theme.css`, then `dark.css`). Never write a raw Tailwind palette class
(`bg-blue-500`, `text-emerald-600`); CI rejects them (`pnpm run design-check`).

| Need | Use |
|---|---|
| Page background | `bg-canvas` |
| Card, table, dialog, input surface | `bg-card` / `bg-background` |
| Table header, toolbar, read-only field | `bg-muted` |
| Body text / secondary text | `text-foreground` / `text-muted-foreground` |
| Secondary text on a tinted or selected surface | `text-strong-foreground` |
| Disabled text, decorative icons **only** | `text-subtle-foreground` (2.56:1, never for readable text) |
| Primary action, link, selection, focus | `bg-primary` / `text-primary` / `ring-ring` |
| Selected row, active segment | `bg-primary-tint` |
| Secondary action | `<Button variant="secondary">` (white, grey border) |
| Status: icon/dot · text · background | `text-success` · `text-success-text` · `bg-success-bg` (also `warning`, `error`, `info`) |
| AI / intelligence (only) | `text-ai`, `text-ai-text`, `bg-ai-tint`, `<Badge variant="ai">` |
| Hairline / emphasis / input border | `border-border` / `border-border-strong` / `border-input` |
| Text on a Midnight Navy panel | `text-white`, `text-sidebar-foreground`, `text-sidebar-muted-foreground`, `text-sidebar-primary` |

Rules: one primary (blue) action per view · status colours only for status · teal only for AI · **no module colours** (a module is identified by
its icon and name) · no gradients, glass or translucent surfaces · use the `-text` shade for any status text.

### Marketing surfaces (website only)

The website may use richer surfaces than the product, built from the same palette:
`brand-stage` (Midnight Navy with soft blue/teal light, used for the hero, dark chapters and the closing CTA), `soft-wash` and
`surface-band` (alternating light bands), `text-brand-highlight` (headline emphasis on navy), `cta-glow`. Add
`data-theme="dark"` to a brand-stage section and its content switches to the dark tokens automatically. Scroll motion lives in
`apps/landing/components/home/ScrollExperience.tsx` (reveals, section connectors, story rail, progress bar, card spotlight,
preview tilt) and is disabled under `prefers-reduced-motion`. None of this belongs in the product UI.

## 2. Type, spacing, shape

- Inter, weights 400 / 500 / 600 (`font-bold` resolves to 600). Minimum size **12px** (`text-caption`).
  Scale: `text-caption` 12 · `text-body-sm` 13 · `text-sm` 14 · `text-subheading` 16 · `text-heading` 20 · `text-metric` 24.
- Numbers in tables, KPIs and money: add `tabular`.
- Radius: 4 (badges) · 6 (buttons, inputs) · 8 (cards, dialogs). Larger radius utilities are capped at 8px.
- Cards use a hairline, not a shadow. Shadows are for popovers, toasts, dialogs and drawers.
- Spacing on a 4px grid; page gutters come from `PageContainer`.

## 3. Pieces to build with

| Layer | Pieces |
|---|---|
| Shell (web-app) | `AppSidebar` (navy, grouped, module pages inline) · `TopHeader` (breadcrumbs, Ctrl/⌘K search) · `PageContainer` |
| Page header | `PageHeader` (library) · `ModulePageHeader` (adds the "Preview · sample data" marker) |
| Lists | `DataTable` (+ `emptyState`, `loading`, pagination) · `FilterSelect` · `SearchInput` · `Badge` |
| Detail / edit | `Sheet` (drawer) · `Dialog` · `AlertDialog` for anything destructive · `Field` + `FieldLabel` + inputs |
| Dashboards | `MetricCard` · `WidgetCard` · `ActionList` · `ActivityFeed` · `EntityList` · charts (`@innostes/ui/charts`) |
| Feedback | `toast` · `Alert` · `Skeleton` · `EmptyState` (inside tables: `className="border-0"`) |
| Brand | `BrandLogo` (`@innostes/kernel`) / `Logo` (website). Artwork in `packages/ui/assets/brand/` |
| Catalog cards | `AppCard` (modules/plugins: neutral icon tile + name) |

If a piece is missing, add it to the shared layer first, then use it. Don't hand-build it inside a page.

## 4. Pages

Every route renders inside `PageContainer` and follows a template: **Dashboard** (header, KPIs, needs-attention, details),
**List** (header with primary action, filters, `DataTable`), **Detail** (drawer or page with tabs), **Form** (sectioned fields,
right-aligned Cancel/Submit), **Settings**. Every data region has loading, empty and error states.

URLs: `/modules/:module/:page` and `/plugins/:plugin/:page` (see `apps/web-app/src/app/navigation/routes.ts`). Link with
`<Link href>` from `NavigationContext` so Ctrl/⌘-click and screen readers work.

## 5. Accessibility checklist

Visible focus (never remove outlines) · every icon-only button has `aria-label` (plus a `Tooltip` in the shell) · inputs have labels ·
status never by colour alone (icon or text too) · text ≥ 4.5:1, UI boundaries ≥ 3:1 · motion respects `prefers-reduced-motion`
(global rule in `theme.css`).

## 6. Checks

```bash
pnpm run design-check                      # raw colours, <12px text, gradients, emoji + WCAG contrast of all token pairs
node packages/ui/scripts/generate-token-data.mjs   # after changing tokens: regenerate docs token/contrast data
pnpm run arch-check                        # package boundaries
```
