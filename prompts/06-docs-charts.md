# Prompt 6 — Docs: Charts (`@innostes/ui/charts`)

## Context
Charts live behind a **separate entry point**, `@innostes/ui/charts`, specifically so apps that
don't use charts don't pay for Recharts in their bundle. Exports (see
`packages/ui/src/charts/index.ts`): `BarChart`, `LineChart`, `AreaChart`, `DonutChart`,
`ChartLegend`, `ChartTooltipContent`, `ChartFrame`, `resolveChartColor`, `useHiddenSeries`.

Key facts that MUST be documented accurately (get them from `packages/ui/package.json` and
`tests/ui-react17` / `tests/ui-react18` setups — don't guess versions):
- Peer dependency: `"recharts": "^2.15.0 || ^3.0.0"`, marked `optional` in `peerDependenciesMeta`
  — consumers only need to install it if they use `@innostes/ui/charts`.
- React 17 projects should use Recharts **2.15.x**; React 18/19 projects can use Recharts **3.x**
  (this split exists because of a transitive peer conflict discovered via `tests/ui-react17`).
- Every chart renders an accessible, visually-hidden `<table>` alongside the visual chart (via
  `ChartFrame`) so screen readers get real tabular data — this is a selling point, document it.
- Colors come from the `chart-1..8` categorical tokens in `theme.css`/`dark.css`, resolved via
  `resolveChartColor` (also accepts semantic tones like `success`/`destructive` — see
  `DonutChart`'s `color` field usage in its test file).
- Legends are interactive: clicking a legend entry toggles that series via `useHiddenSeries`; a
  chart with only one series hides its legend entirely (see `charts.test.tsx` for exact behavior
  to document, e.g. "hides the legend for a single series").

## Task
1. Create `content/docs/widgets/charts.mdx` (or `content/docs/components/charts.mdx` — check
   which top-level nav section fits better given the existing `meta.json` structure; charts are
   arguably their own top-level nav section — if so add `"---Charts---"` + `"...charts"` to the
   root `content/docs/meta.json` the same way `"---Widgets---"` is done, and create
   `content/docs/charts/meta.json` + one page per chart, OR a single combined page — use judgment
   based on how much content fits comfortably in prose vs. needing its own nav entry per
   component). Prefer **one page per chart type** if the API differs meaningfully
   (`BarChart`/`LineChart`/`AreaChart` can likely share one "Cartesian charts" page since they're
   nearly identical in props per the test file; `DonutChart` should get its own page since it has
   a distinct `data`/`centerValue`/`centerLabel` API).
2. Cover, across whichever page split you choose:
   - Installation: `pnpm add recharts` (version pinned per React major, explained above) alongside
     `@innostes/ui`.
   - Import path: `import { BarChart } from '@innostes/ui/charts';` — explicitly NOT from
     `@innostes/ui` root.
   - Props: `data`, `categoryKey`, `series` (`key`/`label` pairs), `valueFormatter`, `locale`,
     `aria-label` (required for the accessible table's name).
   - The accessibility story (hidden table) — this is a genuine differentiator, write it up
     properly, not as a footnote.
   - Theming via `chart-1..8` tokens + semantic tone colors.
   - `DonutChart`'s center value/label and percentage-table behavior.
3. Write demo files under `components/demos/charts/<name>/basic.tsx` (or match whatever final path
   convention you chose above) with realistic ERP/HRMS-flavored data (headcount by month,
   attendance today, revenue by region, etc.) — don't reuse the exact data from the test file
   verbatim, make it look like real product content.
4. Add `<ApiTable components={['BarChart', 'LineChart', 'AreaChart', 'DonutChart']} />` (API
   generator must include `src/charts/**/*.tsx` in its glob — it already does per
   `packages/ui/scripts/generate-api-docs.mjs`, just confirm `dist/api.json` is regenerated and
   fresh).

## Definition of done
- [ ] Charts are documented with a clear "this is a separate entry point, here's why" explanation
      up front.
- [ ] React-17-vs-18/19 Recharts version guidance is explicit and correct (verified against
      `packages/ui/package.json` and the compat test projects, not assumed).
- [ ] Demos render live and show real/realistic data, with accessible-table behavior visible on
      inspection (e.g. via browser dev tools or a quick DOM check).
- [ ] Nav (`meta.json`, and root nav if a new top-level section was added) updated.
- [ ] `pnpm nx run-many -t build typecheck -p landing` passes.
- [ ] Nothing is committed.
