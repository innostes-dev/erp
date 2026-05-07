# Step 6 — Connect to the API

This step replaces the mock data in the `data-access` sub-library with real HTTP calls and adds a React hook so the feature component can subscribe to loading, data, and error states reactively.

---

## How the HTTP layer works

All API calls go through `@mono/data-access/http`. That library wraps `axios` and automatically attaches the `Authorization: Bearer <token>` header by reading from `sessionStorage` in a request interceptor. You never need to read the token yourself in a `data-access` file.

```
Component
  └─ usePayments() hook
       └─ fetchPaymentsSummary()
            └─ get('/api/payments/summary')    from @mono/data-access/http
                 └─ axios + auth interceptor
                      └─ API Gateway
```

---

## 1. Define the TypeScript types and API function

### `libs/modules/payments/data-access/src/lib/payments.api.ts`

```typescript
import { get } from '@mono/data-access/http';
import type { ApiResponse } from '@mono/shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentMetric {
  label: string;
  value: number;
  previous: number;
  /** Controls how PaymentsDashboard formats the display value. */
  format: 'currency' | 'count' | 'percent';
  /** When true, a lower value is shown as good (green). Default false. */
  lowerIsBetter?: boolean;
}

export interface PaymentsSummary {
  metrics: PaymentMetric[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the top-level payments summary from the API gateway.
 *
 * The HTTP client automatically attaches the auth token from sessionStorage,
 * so no Authorization header is needed here.
 */
export async function fetchPaymentsSummary(): Promise<ApiResponse<PaymentsSummary>> {
  return get<ApiResponse<PaymentsSummary>>('/api/payments/summary');
}

/**
 * Fetch a paginated list of transactions.
 */
export async function fetchTransactions(params?: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}): Promise<ApiResponse<{ items: Transaction[]; total: number }>> {
  const query = new URLSearchParams();
  if (params?.page)     query.set('page',     String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.from)     query.set('from',     params.from);
  if (params?.to)       query.set('to',       params.to);

  const qs = query.toString();
  return get<ApiResponse<{ items: Transaction[]; total: number }>>(
    `/api/payments/transactions${qs ? `?${qs}` : ''}`,
  );
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  description: string;
  merchantName: string;
}
```

### `libs/modules/payments/data-access/src/index.ts`

```typescript
export { fetchPaymentsSummary, fetchTransactions } from './lib/payments.api';
export type { PaymentMetric, PaymentsSummary, Transaction } from './lib/payments.api';
```

---

## 2. Create the `usePayments` hook

Add a hook file in the same `lib/` folder. Hooks belong in `data-access` (not `feature`) because they are concerned with data fetching, not page composition.

### `libs/modules/payments/data-access/src/lib/use-payments.ts`

```typescript
'use client';

import { useEffect, useReducer, useCallback } from 'react';
import { fetchPaymentsSummary } from './payments.api';
import type { PaymentsSummary } from './payments.api';

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PaymentsSummary }
  | { status: 'error'; message: string };

type Action =
  | { type: 'fetch' }
  | { type: 'success'; data: PaymentsSummary }
  | { type: 'error'; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch':   return { status: 'loading' };
    case 'success': return { status: 'success', data: action.data };
    case 'error':   return { status: 'error', message: action.message };
    default:        return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UsePaymentsResult {
  summary: PaymentsSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePayments(): UsePaymentsResult {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });

  const load = useCallback(() => {
    dispatch({ type: 'fetch' });
    fetchPaymentsSummary()
      .then((res) => dispatch({ type: 'success', data: res.data }))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to load payments data';
        dispatch({ type: 'error', message });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary: state.status === 'success' ? state.data : null,
    loading: state.status === 'loading' || state.status === 'idle',
    error:   state.status === 'error' ? state.message : null,
    refetch: load,
  };
}
```

Export the hook from the barrel:

### `libs/modules/payments/data-access/src/index.ts` (updated)

```typescript
export { fetchPaymentsSummary, fetchTransactions } from './lib/payments.api';
export type { PaymentMetric, PaymentsSummary, Transaction } from './lib/payments.api';

export { usePayments } from './lib/use-payments';
export type { UsePaymentsResult } from './lib/use-payments';
```

---

## 3. Use the hook in the feature component

Replace the inline `useEffect` + `useState` in `payments-dashboard.tsx` with the `usePayments` hook:

### `libs/modules/payments/feature/src/lib/payments-dashboard.tsx` (updated)

```tsx
'use client';

import { CreditCard, RefreshCw } from 'lucide-react';
import { usePayments } from '@mono/modules/payments/data-access';
import { StatCard } from '@mono/modules/payments/ui';
import type { StatCardMetric } from '@mono/modules/payments/ui';
import { formatCurrency, formatCount } from '@mono/modules/payments/utils';
import type { PaymentMetric } from '@mono/modules/payments/data-access';

function toStatCardProps(metric: PaymentMetric): {
  metric: StatCardMetric;
  displayValue: string;
} {
  let displayValue: string;
  switch (metric.format) {
    case 'currency': displayValue = formatCurrency(metric.value); break;
    case 'percent':  displayValue = `${metric.value.toFixed(1)}%`; break;
    default:         displayValue = formatCount(metric.value);
  }
  return {
    metric: {
      label:          metric.label,
      value:          metric.value,
      previous:       metric.previous,
      format:         metric.format,
      lowerIsBetter:  metric.lowerIsBetter,
    },
    displayValue,
  };
}

function StatCardSkeleton() {
  return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;
}

function EmptyState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <CreditCard className="mb-3 h-10 w-10 text-gray-300" />
      <p className="text-sm font-medium text-gray-900">{message}</p>
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

export function PaymentsDashboard() {
  const { summary, loading, error, refetch } = usePayments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Transaction volume, revenue, and processing metrics.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState message={error} onRetry={refetch} />
      ) : summary ? (
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
      ) : null}

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

## 4. Handle loading, error, and empty states

| State | Cause | UI |
|---|---|---|
| `loading: true` | Initial fetch or `refetch()` called | Four pulsing skeleton cards |
| `error: string` | Network failure or non-2xx response | `EmptyState` with the error message and a Retry button |
| `summary !== null` | Successful response | Grid of `StatCard` components |
| `summary === null && !loading && !error` | API returned `{ success: true, data: null }` | `EmptyState` with "No data available" |

The hook's reducer ensures only one of these states is active at a time.

---

## 5. Passing the Authorization header manually (advanced)

The shared `httpClient` in `@mono/data-access/http` attaches the token automatically from `sessionStorage` via an Axios request interceptor. You will never need to set the header yourself for standard authenticated calls.

However, if you need to call an endpoint as a **specific user** (e.g. an admin acting on behalf of another user), or if you call a different base URL, you can override the header:

```typescript
import { get } from '@mono/data-access/http';

// Override for a single request
export async function fetchAsUser(userId: string, token: string) {
  return get<ApiResponse<PaymentsSummary>>('/api/payments/summary', {
    headers: { Authorization: `Bearer ${token}` },
    params: { userId },
  });
}
```

If you need the current user's token in a client component (e.g. to build a WebSocket URL), read it from the `useAuth` hook in `@mono/kernel/auth`:

```typescript
'use client';

import { useAuth } from '@mono/kernel/auth';

export function useAuthenticatedWebSocket(url: string) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${url}?token=${token}`);
    return () => ws.close();
  }, [url, token]);
}
```

Do not read from `sessionStorage` directly in component code — always use `useAuth()` so the auth state stays consistent with the context.

---

## 6. Using a mock while the API is not ready

Before the NestJS endpoint exists, return mock data from the API function so the UI is fully functional:

```typescript
// In payments.api.ts — swap this for the real get() call when the API is ready

export async function fetchPaymentsSummary(): Promise<ApiResponse<PaymentsSummary>> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400));

  return {
    success: true,
    data: {
      updatedAt: new Date().toISOString(),
      metrics: [
        { label: 'Total revenue',       value: 1_284_300, previous: 1_102_000, format: 'currency' },
        { label: 'Transactions',         value: 42_810,    previous: 38_200,    format: 'count'    },
        { label: 'Success rate',         value: 98.4,      previous: 97.9,      format: 'percent'  },
        { label: 'Failed transactions',  value: 683,       previous: 810,       format: 'count',   lowerIsBetter: true },
      ],
    },
  };
}
```

When the API endpoint is live, replace the mock body with:

```typescript
export async function fetchPaymentsSummary(): Promise<ApiResponse<PaymentsSummary>> {
  return get<ApiResponse<PaymentsSummary>>('/api/payments/summary');
}
```

---

## Next steps

Continue with [07 — Full checklist](./07-full-checklist.md).
