# Step 3 — Build the Feature Component

This step builds the main dashboard component that the shell page renders, plus the shared `StatCard` presentational component in the `ui` sub-library, and the pure formatting helpers in the `utils` sub-library.

---

## 1. Create the utils helpers

Pure functions have no React dependency, so build them first — everything else can import them.

### `libs/modules/payments/utils/src/lib/payments.utils.ts`

```typescript
/**
 * Format a number as a currency string.
 * Defaults to USD. Pass a different locale/currency for other regions.
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate percentage change from `previous` to `current`.
 * Returns 0 when previous is 0 to avoid division by zero.
 */
export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format a large count with K / M suffix.
 * e.g. 84210 → "84.2K", 1000000 → "1.0M"
 */
export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
```

Update the barrel export to include all three functions:

### `libs/modules/payments/utils/src/index.ts`

```typescript
export { formatCurrency, calcPercentChange, formatCount } from './lib/payments.utils';
```

---

## 2. Create the `StatCard` presentational component

`StatCard` lives in the `ui` sub-library. It is a dumb component — it accepts data as props and renders it. It has no knowledge of the API.

### `libs/modules/payments/ui/src/lib/stat-card.tsx`

```tsx
'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { calcPercentChange } from '@mono/modules/payments/utils';

export interface StatCardMetric {
  label: string;
  value: number;
  previous: number;
  /** Controls how the value is displayed. */
  format: 'currency' | 'count' | 'percent';
  /** When true, a decrease is shown in green (e.g. "failed transactions"). */
  lowerIsBetter?: boolean;
}

interface StatCardProps {
  metric: StatCardMetric;
  /** Pre-formatted display value (e.g. "$1,234"). */
  displayValue: string;
}

export function StatCard({ metric, displayValue }: StatCardProps) {
  const change = calcPercentChange(metric.value, metric.previous);
  const isIncrease = change >= 0;
  const isGood = metric.lowerIsBetter ? !isIncrease : isIncrease;

  const TrendIcon = isIncrease ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {metric.label}
      </p>

      <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">
        {displayValue}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            isGood
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <TrendIcon size={10} />
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-xs text-gray-400">vs last period</span>
      </div>
    </div>
  );
}
```

Update the barrel:

### `libs/modules/payments/ui/src/index.ts`

```typescript
export { StatCard } from './lib/stat-card';
export type { StatCardMetric } from './lib/stat-card';
```

---

## 3. Create the main dashboard component

The feature component is the only thing the shell page sees. It orchestrates data fetching, loading states, and layout. It delegates rendering to the `ui` and `utils` sub-libraries.

### `libs/modules/payments/feature/src/lib/payments-dashboard.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { fetchPaymentsSummary } from '@mono/modules/payments/data-access';
import type { PaymentsSummary } from '@mono/modules/payments/data-access';
import { StatCard } from '@mono/modules/payments/ui';
import type { StatCardMetric } from '@mono/modules/payments/ui';
import { formatCurrency, formatCount } from '@mono/modules/payments/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a raw PaymentsSummary metric into the shape StatCard expects,
 * including a pre-formatted display value.
 */
function toStatCardProps(
  metric: PaymentsSummary['metrics'][number],
): { metric: StatCardMetric; displayValue: string } {
  let displayValue: string;

  switch (metric.format) {
    case 'currency':
      displayValue = formatCurrency(metric.value);
      break;
    case 'percent':
      displayValue = `${metric.value.toFixed(1)}%`;
      break;
    default:
      displayValue = formatCount(metric.value);
  }

  return {
    metric: {
      label: metric.label,
      value: metric.value,
      previous: metric.previous,
      format: metric.format,
      lowerIsBetter: metric.lowerIsBetter,
    },
    displayValue,
  };
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
  );
}

// ---------------------------------------------------------------------------
// Empty / error state
// ---------------------------------------------------------------------------

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <CreditCard className="mb-3 h-10 w-10 text-gray-300" />
      <p className="text-sm font-medium text-gray-900">No payment data available</p>
      <p className="mt-1 text-xs text-gray-500">
        Metrics will appear once transactions are recorded.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        <RefreshCw size={12} />
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PaymentsDashboard() {
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchPaymentsSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Transaction volume, revenue, and processing metrics.
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error || !summary ? (
        <EmptyState onRetry={load} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.metrics.map((m) => {
            const props = toStatCardProps(m);
            return (
              <StatCard
                key={m.label}
                metric={props.metric}
                displayValue={props.displayValue}
              />
            );
          })}
        </div>
      )}

      {/* Footer timestamp */}
      {summary && (
        <p className="text-xs text-gray-400">
          Last updated {new Date(summary.updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
```

---

## 4. Export from the feature index

The index file already contains this line from step 2, so verify it is present:

### `libs/modules/payments/feature/src/index.ts`

```typescript
export { PaymentsDashboard } from './lib/payments-dashboard';
```

That single export is what `apps/shell/src/app/(modules)/payments/page.tsx` will import.

---

## Tailwind patterns used in this component

### `cn()` utility

The shell's `cn` helper merges Tailwind classes with conflict resolution. Import it when a component needs conditional classes:

```typescript
import { cn } from '@mono/shared/utils';
// or, inside the shell app itself:
// import { cn } from '../../lib/cn';
```

Usage:

```tsx
<div className={cn('rounded-xl p-5', isActive && 'ring-2 ring-indigo-500')} />
```

Note: `cn` from `@mono/shared/utils` is the same `clsx` + `tailwind-merge` composition used throughout the shell.

### Pulse skeleton

```tsx
<div className="h-32 animate-pulse rounded-xl bg-gray-100" />
```

`animate-pulse` is a built-in Tailwind animation. Use a fixed height matching the real card so the layout does not shift when data loads.

### Gradient classes

Gradients used in the module's `gradient` field follow the pattern:

```
from-<color>-500 to-<color>-600
```

Do not use these inside module-internal components. They are only needed in the shell's module registry and sidebar where the icon badges appear.

### Lucide icons

Import icons individually from `lucide-react`:

```typescript
import { CreditCard, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
```

Pass `size` as a prop (number of pixels) and `className` for colour:

```tsx
<CreditCard size={20} className="text-gray-300" />
```

Do not import `lucide-react/dist/esm/icons/index` — always import from the package root to enable tree-shaking.

---

## What the component looks like

When data is loading:
- Four grey pulsing rectangles at the same height as the real cards

When data loads successfully:
- Four `StatCard` tiles in a responsive grid (1 → 2 → 4 columns)
- Each card shows label, value, and a coloured percentage badge

When the API call fails:
- A centred empty-state panel with a `CreditCard` icon and a **Retry** button that re-triggers `load()`

---

## Next steps

Continue with [04 — Add shell routes](./04-add-shell-routes.md).
