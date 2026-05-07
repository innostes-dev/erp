# Adding a New Module — Step by Step

This guide walks through adding a `reporting` module from scratch. Replace `reporting` with your module name throughout.

---

## Option A: Use the generator (recommended)

```bash
pnpm nx g @mono/generators:module --name=reporting
```

This runs in seconds and creates everything in steps 1–4 below automatically. Then skip to step 5.

---

## Option B: Manual steps

### Step 1 — Create the four library layers

```
libs/modules/reporting/
├── feature/     What the user sees — pages, containers, orchestration
├── ui/          Pure presentational components specific to this module
├── data-access/ API calls, data fetching, types returned from the server
└── utils/       Pure helper functions with no React/side effects
```

For each of the four layers, create `project.json`:

```json
// libs/modules/reporting/feature/project.json
{
  "name": "reporting-feature",
  "$schema": "../../../../node_modules/nx/schemas/project.json",
  "sourceRoot": "libs/modules/reporting/feature/src",
  "projectType": "library",
  "tags": ["type:feature", "scope:reporting", "platform:web"]
}
```

Tag mapping per layer:

| Layer | type tag | platform tag |
|---|---|---|
| feature | `type:feature` | `platform:web` |
| ui | `type:ui` | `platform:web` |
| data-access | `type:data-access` | `platform:web` |
| utils | `type:util` | `platform:isomorphic` |

Create `tsconfig.json` in each layer:

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "strict": true },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }]
}
```

Create `tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "../../../../dist/out-tsc", "declaration": true },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

Create empty barrel files:

```bash
mkdir -p libs/modules/reporting/{feature,ui,data-access,utils}/src
echo "// reporting public API" > libs/modules/reporting/feature/src/index.ts
echo "// reporting public API" > libs/modules/reporting/ui/src/index.ts
echo "// reporting public API" > libs/modules/reporting/data-access/src/index.ts
echo "// reporting public API" > libs/modules/reporting/utils/src/index.ts
```

### Step 2 — Add path aliases to tsconfig.base.json

```json
// tsconfig.base.json → compilerOptions.paths
{
  "@mono/modules/reporting/feature":     ["libs/modules/reporting/feature/src/index.ts"],
  "@mono/modules/reporting/ui":          ["libs/modules/reporting/ui/src/index.ts"],
  "@mono/modules/reporting/data-access": ["libs/modules/reporting/data-access/src/index.ts"],
  "@mono/modules/reporting/utils":       ["libs/modules/reporting/utils/src/index.ts"]
}
```

### Step 3 — Add to transpilePackages in next.config.ts

```ts
// apps/shell/next.config.ts
transpilePackages: [
  // ... existing entries ...
  '@mono/modules/reporting/feature',
  '@mono/modules/reporting/ui',
  '@mono/modules/reporting/data-access',
  '@mono/modules/reporting/utils',
],
```

### Step 4 — Create the shell route

```
apps/shell/src/app/(reporting)/
├── layout.tsx          Copy from (analytics)/layout.tsx — same sidebar layout
└── reporting/
    └── page.tsx        Auth-guarded server component
```

```tsx
// apps/shell/src/app/(reporting)/reporting/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth';
import { ReportingDashboard } from '@mono/modules/reporting/feature';

export default async function ReportingPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  return (
    <div className="p-8">
      <ReportingDashboard />
    </div>
  );
}
```

### Step 5 — Register the module in the shell nav

Open `apps/shell/src/lib/modules.ts` and add an entry to the `MODULES` array:

```ts
import { BarChartIcon, ReportIcon } from './module-icons';  // add your icon

export const MODULES: ModuleDefinition[] = [
  {
    id: 'analytics',
    // ...existing entry
  },
  {
    id: 'reporting',
    name: 'Reporting',
    description: 'Scheduled reports, exports, and data summaries.',
    route: '/reporting',
    gradient: 'from-cyan-500 to-blue-600',
    iconColor: 'text-cyan-100',
    borderColor: 'hover:border-cyan-300',
    icon: ReportIcon,
  },
];
```

The workspace launcher and sidebar nav both read from `MODULES` — adding one entry here surfaces the module in both places automatically.

### Step 6 — Add an icon (if needed)

Add your SVG icon to `apps/shell/src/lib/module-icons.tsx`:

```tsx
export function ReportIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
      {/* your SVG path */}
    </svg>
  );
}
```

Use any Heroicons outline SVG — copy the `<path>` from heroicons.com.

### Step 7 — Implement your module layers

Start from the bottom up:

```
utils    → pure helpers, no dependencies
data-access → API functions, types, (optionally) Zustand store
ui       → presentational components, uses types from data-access and utils
feature  → orchestrates data-access + ui, can use kernel
```

#### Example utils

```ts
// libs/modules/reporting/utils/src/lib/reporting.utils.ts
export function formatReportPeriod(start: Date, end: Date): string {
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}
```

#### Example data-access

```ts
// libs/modules/reporting/data-access/src/lib/reporting.api.ts
import type { ApiResponse } from '@mono/shared/types';

export interface Report {
  id: string;
  name: string;
  createdAt: string;
}

export async function fetchReports(): Promise<ApiResponse<Report[]>> {
  const res = await fetch('/api/reporting/reports');
  return res.json() as Promise<ApiResponse<Report[]>>;
}
```

#### Example ui component

```tsx
// libs/modules/reporting/ui/src/lib/report-row.tsx
'use client';
import type { Report } from '@mono/modules/reporting/data-access';

export function ReportRow({ report }: { report: Report }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <span className="font-medium">{report.name}</span>
      <span className="text-sm text-gray-400">{report.createdAt}</span>
    </div>
  );
}
```

#### Example feature component

```tsx
// libs/modules/reporting/feature/src/lib/reporting-dashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchReports, type Report } from '@mono/modules/reporting/data-access';
import { ReportRow } from '@mono/modules/reporting/ui';

export function ReportingDashboard() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchReports().then((res) => setReports(res.data));
  }, []);

  return (
    <div className="space-y-3">
      {reports.map((r) => <ReportRow key={r.id} report={r} />)}
    </div>
  );
}
```

#### Export from the barrel

```ts
// libs/modules/reporting/feature/src/index.ts
export { ReportingDashboard } from './lib/reporting-dashboard';
```

---

## Step 8 — Verify boundaries with lint

```bash
pnpm nx lint reporting-feature
pnpm nx lint reporting-ui
pnpm nx lint reporting-data-access
pnpm nx lint reporting-utils
```

If you accidentally import from the wrong layer (e.g. `ui` importing from `data-access`), the `@nx/enforce-module-boundaries` rule will error immediately.

---

## Checklist

- [ ] Four libs created with correct `project.json` tags
- [ ] Path aliases added to `tsconfig.base.json`
- [ ] Libs added to `transpilePackages` in `next.config.ts`
- [ ] Route group `(module-name)` created with `layout.tsx` + `page.tsx`
- [ ] Module entry added to `MODULES` in `apps/shell/src/lib/modules.ts`
- [ ] Icon added to `module-icons.tsx`
- [ ] `pnpm nx lint <each-lib>` passes
