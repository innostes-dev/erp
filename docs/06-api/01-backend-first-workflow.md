# 01 — Backend-First Development Workflow

Backend-first means: **design and document the API contract before writing a single line of business logic or frontend code**. The Swagger UI at `/api/docs` becomes the collaboration surface — stakeholders review the contract, not a Figma mockup of imagined JSON shapes.

This guide walks through adding a new endpoint — `GET /api/payments/summary` — from idea to integration test, using the backend-first approach.

---

## Why Backend-First?

The traditional workflow looks like this:

```
Product spec → Frontend mockup → Frontend fetches made-up JSON →
Backend built to match frontend → Mismatch found → Rework
```

The backend-first workflow:

```
Product spec → DTO written → Swagger shows contract → Stakeholders review →
Backend implemented → Frontend built against live API → Integration test
```

Benefits:
- The contract is locked before any frontend work begins — no late-breaking shape changes
- Stakeholders see real request/response shapes, not imagined ones
- Backend and frontend can be built in parallel once the contract is agreed
- The API is documented before it ships, not after

---

## Concrete Example: `GET /api/payments/summary`

**Requirement**: The dashboard needs a summary of payment totals grouped by status and currency, for the current month.

---

## Step 1 — Write the DTO First

Before any business logic, define the shape of the response. This forces you to think about what data the frontend actually needs and how it should be structured.

Create `apps/api-gateway/src/modules/payments/dto/payment-summary.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

/**
 * A single summary bucket: one currency + status combination.
 */
export class PaymentSummaryItemDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  currency!: string;

  @ApiProperty({
    example: 'completed',
    enum: ['pending', 'completed', 'refunded', 'failed'],
    description: 'Payment status for this bucket',
  })
  status!: string;

  @ApiProperty({ example: 12, description: 'Number of payments in this bucket' })
  count!: number;

  @ApiProperty({ example: 1249.88, description: 'Total amount for this bucket' })
  total!: number;
}

/**
 * Full summary response returned by GET /api/payments/summary
 */
export class PaymentSummaryDto {
  @ApiProperty({ type: [PaymentSummaryItemDto], description: 'Per-status, per-currency breakdown' })
  buckets!: PaymentSummaryItemDto[];

  @ApiProperty({ example: 42, description: 'Total number of payments this month' })
  totalPayments!: number;

  @ApiProperty({ example: 5890.22, description: 'Grand total across all currencies (in USD equivalent)' })
  grandTotal!: number;

  @ApiProperty({
    example: '2026-05-01T00:00:00.000Z',
    description: 'Start of the reporting period (inclusive)',
  })
  periodStart!: string;

  @ApiProperty({
    example: '2026-05-31T23:59:59.999Z',
    description: 'End of the reporting period (inclusive)',
  })
  periodEnd!: string;
}
```

At this point there is no service logic and no repository method. The DTO exists only to describe the shape.

---

## Step 2 — Add a Stub Endpoint to the Controller

Add the route to the controller with a stub implementation. Return hardcoded data for now — the goal is to get Swagger showing the documented shape, not to return real data.

In `payments.controller.ts`:

```typescript
import { PaymentSummaryDto } from './dto/payment-summary.dto';

// Add this route alongside the existing ones:

@Get('summary')
@ApiOperation({
  summary: 'Payment summary',
  description:
    'Returns total payment counts and amounts grouped by status and currency ' +
    'for the current calendar month. Useful for dashboard widgets.',
})
@ApiOkResponse({
  type: PaymentSummaryDto,
  description: 'Summary calculated successfully',
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
async getSummary(): Promise<PaymentSummaryDto> {
  return this.paymentsService.getSummary();
}
```

Add the stub method to `payments.service.ts`:

```typescript
async getSummary(): Promise<PaymentSummaryDto> {
  // Stub — returns realistic hardcoded data for contract review
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    buckets: [
      { currency: 'USD', status: 'completed', count: 28, total: 1399.72 },
      { currency: 'USD', status: 'pending',   count: 5,  total: 249.95  },
      { currency: 'EUR', status: 'completed', count: 9,  total: 449.91  },
      { currency: 'EUR', status: 'refunded',  count: 2,  total: 99.98   },
    ],
    totalPayments: 44,
    grandTotal: 2199.56,
    periodStart: periodStart.toISOString(),
    periodEnd:   periodEnd.toISOString(),
  };
}
```

---

## Step 3 — Review in Swagger UI with Stakeholders

Restart the server (`pnpm nx run api-gateway:serve`) and navigate to `http://localhost:3001/api/docs`.

What to check with stakeholders:

1. Open the `GET /api/payments/summary` route in Swagger
2. Scroll to "Responses" → expand the 200 schema
3. Walk through each field: Does `buckets` make sense? Is `grandTotal` the right abstraction? Should `periodStart`/`periodEnd` be query parameters instead of response fields?
4. Click "Try it out" → "Execute" → show the actual JSON response shape
5. Compare the example values to the real business numbers — does the shape handle edge cases (multiple currencies, zero payments)?

**This conversation happens before any database query is written.** Changes to the DTO at this stage are cheap — one file, zero migration, zero frontend rework.

Common review outcomes:
- "Can we filter by a custom date range?" → add `from` and `to` query parameters to the DTO
- "We need the per-user breakdown too" → add a `byUser` array to `PaymentSummaryDto`
- "Remove `grandTotal` — we can't convert currencies reliably" → delete the field

Make all changes to the DTO and re-review until the contract is agreed.

---

## Step 4 — Implement the Service Logic

Once the contract is locked, implement the real business logic.

Update `IPaymentRepository` to add the summary query method:

```typescript
// payment.repository.interface.ts
export interface IPaymentRepository {
  findAll(): Promise<PaymentRow[]>;
  findById(id: string): Promise<PaymentRow | null>;
  create(data: NewPaymentRow): Promise<PaymentRow>;
  update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null>;
  getSummary(from: Date, to: Date): Promise<PaymentSummaryItemRaw[]>;  // ← new
}

// Helper type for raw summary data coming from the DB
export interface PaymentSummaryItemRaw {
  currency: string;
  status: string;
  count: number;
  total: number;
}
```

Implement in `StaticPaymentRepository`:

```typescript
async getSummary(from: Date, to: Date): Promise<PaymentSummaryItemRaw[]> {
  const relevant = this.store.filter(
    (p) => p.createdAt >= from && p.createdAt <= to,
  );

  const map = new Map<string, PaymentSummaryItemRaw>();

  for (const p of relevant) {
    const key = `${p.currency}:${p.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += Number(p.amount);
    } else {
      map.set(key, { currency: p.currency, status: p.status, count: 1, total: Number(p.amount) });
    }
  }

  return Array.from(map.values());
}
```

Implement in `DrizzlePaymentRepository`:

```typescript
async getSummary(from: Date, to: Date): Promise<PaymentSummaryItemRaw[]> {
  const rows = await this.db
    .select({
      currency: payments.currency,
      status: payments.status,
      count: sql<number>`count(*)::int`,
      total: sql<number>`sum(${payments.amount})::float`,
    })
    .from(payments)
    .where(and(gte(payments.createdAt, from), lte(payments.createdAt, to)))
    .groupBy(payments.currency, payments.status);

  return rows;
}
```

Update the service method to use real data:

```typescript
async getSummary(): Promise<PaymentSummaryDto> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const raw = await this.repo.getSummary(periodStart, periodEnd);

  const totalPayments = raw.reduce((sum, b) => sum + b.count, 0);
  const grandTotal    = raw.reduce((sum, b) => sum + b.total, 0);

  return {
    buckets: raw.map((b) => ({
      currency: b.currency,
      status:   b.status,
      count:    b.count,
      total:    Math.round(b.total * 100) / 100,
    })),
    totalPayments,
    grandTotal: Math.round(grandTotal * 100) / 100,
    periodStart: periodStart.toISOString(),
    periodEnd:   periodEnd.toISOString(),
  };
}
```

---

## Step 5 — Build the Frontend Against the Live API

Now that the backend returns real data from the agreed-upon contract, the frontend team builds the dashboard widget:

```typescript
// apps/shell/src/app/dashboard/payment-summary.tsx (Next.js)
import type { PaymentSummaryDto } from '@mono/shared/types';

async function fetchSummary(token: string): Promise<PaymentSummaryDto> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch summary');
  const body = await res.json();
  return body.data as PaymentSummaryDto;
}

export default async function PaymentSummaryWidget() {
  const session = await getServerSession();
  const summary = await fetchSummary(session.token);

  return (
    <div>
      <h2>This Month</h2>
      <p>Total payments: {summary.totalPayments}</p>
      {summary.buckets.map((b) => (
        <div key={`${b.currency}-${b.status}`}>
          {b.currency} {b.status}: {b.count} payments, {b.total}
        </div>
      ))}
    </div>
  );
}
```

The frontend developer imports types from `@mono/shared/types` — the same types agreed upon in Step 3. There are no shape guesses.

---

## Step 6 — Integration Test

With both backend and frontend complete, run an end-to-end test:

```bash
# 1. Confirm the backend returns the right shape
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mono.dev","password":"admin123"}' \
  | jq -r '.data.token')

curl -s http://localhost:3001/api/payments/summary \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected response structure:

```json
{
  "success": true,
  "data": {
    "buckets": [
      { "currency": "USD", "status": "completed", "count": 28, "total": 1399.72 },
      { "currency": "USD", "status": "pending",   "count": 5,  "total": 249.95  }
    ],
    "totalPayments": 33,
    "grandTotal": 1649.67,
    "periodStart": "2026-05-01T00:00:00.000Z",
    "periodEnd":   "2026-05-31T23:59:59.999Z"
  },
  "message": "OK"
}
```

```bash
# 2. Confirm the Next.js shell renders the data
open http://localhost:3000/dashboard
```

Check the browser network tab:
- Request to `/api/payments/summary` returns 200
- Response matches the agreed contract
- Dashboard widget renders the correct numbers

---

## Why This Order Matters

| If you skip Step 1 (DTO first) | Consequence |
|---|---|
| Backend implements "what feels right" | Frontend gets wrong shape, rework on both sides |
| No Swagger review | Mismatched assumptions discovered in integration, not design |
| Frontend built on mock data | Mock diverges from real API by the time backend ships |

| If you skip Step 2 (stub first) | Consequence |
|---|---|
| Contract review happens on text descriptions | Stakeholders cannot see real JSON, disagree on naming in PR review |
| Business logic written before review | Changes after review mean rewriting service + repository |

| If you skip Step 3 (stakeholder review) | Consequence |
|---|---|
| Wrong abstraction ships | Dashboard needs a different grouping, requires new API version |
| Missing fields discovered in QA | API version bump, frontend rebuild |

The additional 30 minutes spent on Steps 1–3 consistently saves multiple days of rework.

---

## Summary: The Six Steps

| Step | Action | Output |
|---|---|---|
| 1 | Write DTOs | Request/response shapes exist in code |
| 2 | Add stub controller + service method | Route appears in Swagger with realistic example data |
| 3 | Swagger review | Contract agreed, locked in DTO |
| 4 | Implement real service + repository | Business logic written against locked contract |
| 5 | Frontend builds against live API | UI works with real data immediately |
| 6 | Integration test | End-to-end verification |
