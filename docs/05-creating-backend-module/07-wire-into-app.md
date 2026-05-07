# 07 — Wire Into App

At this point you have created:
- `payments.controller.ts`
- `payments.service.ts`
- `dto/payment.dto.ts` and `dto/refund.dto.ts`
- `repositories/payment.repository.interface.ts`
- `repositories/static-payment.repository.ts`
- `repositories/drizzle-payment.repository.ts`
- `database/schema/payments.schema.ts` (exported from `schema/index.ts`)

This guide wires everything together so the server actually serves the routes.

---

## Step 1 — Create `payments.module.ts`

Create `apps/api-gateway/src/modules/payments/payments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_REPOSITORY } from './repositories/payment.repository.interface';
import { StaticPaymentRepository } from './repositories/static-payment.repository';
// import { DrizzlePaymentRepository } from './repositories/drizzle-payment.repository';
// import { DatabaseModule } from '../../database/database.module';

@Module({
  // imports: [DatabaseModule],  // ← Uncomment when switching to DrizzlePaymentRepository
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    // ── Repository binding ──────────────────────────────────────────────────
    // Swap this ONE line to change the data source:
    { provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository },
    // { provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository }  ← real DB
  ],
})
export class PaymentsModule {}
```

### What each section does

| Section | Content | Why |
|---|---|---|
| `imports` | `DatabaseModule` (commented out) | Makes `DRIZZLE_DB` available when using the real repository |
| `controllers` | `PaymentsController` | Registers route handlers with NestJS's HTTP layer |
| `providers` | `PaymentsService`, repository binding | Registers injectables; the DI container satisfies `PAYMENT_REPOSITORY` |
| `exports` | (none by default) | Add `PaymentsService` here if another module needs to call its methods |

---

## Step 2 — Import PaymentsModule in AppModule

Edit `apps/api-gateway/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';   // ← add this
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    PaymentsModule,   // ← add this
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER,       useClass: AllExceptionsFilter },
    { provide: APP_GUARD,        useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
```

That is the only change required in `app.module.ts`. NestJS discovers all controllers in `PaymentsModule` automatically.

---

## Step 3 — Start the Server

```bash
pnpm --filter @mono/api-gateway dev
# or from the monorepo root:
pnpm nx run api-gateway:serve
```

Expected output:

```
[Bootstrap] API Gateway running on http://localhost:3001/api
[Bootstrap] API Docs available at http://localhost:3001/api/docs
[Bootstrap] Accepting requests from http://localhost:3000
```

If the server fails to start, check:

1. `PaymentsModule` is importing `DatabaseModule` when using `DrizzlePaymentRepository`
2. `DATABASE_URL` is set if using `DrizzlePaymentRepository`
3. All imports in `payments.controller.ts` and `payments.service.ts` resolve (run `tsc --noEmit`)

---

## Step 4 — Verify in Swagger UI

Navigate to `http://localhost:3001/api/docs`.

Check:
- [ ] "payments" group appears in the left sidebar
- [ ] `GET /api/payments` and `POST /api/payments/{id}/refund` are listed
- [ ] Click `GET /api/payments` → click "Try it out" → "Execute" → should return 401 (no token yet)
- [ ] Click `POST /api/auth/login` → "Try it out" → body: `{"email":"admin@mono.dev","password":"admin123"}` → "Execute" → copy the `token` value from the response
- [ ] Click "Authorize" button at the top right → paste the token → "Authorize"
- [ ] Retry `GET /api/payments` → should return 200 with the static payment list

---

## Step 5 — Test with curl

### Login and capture token

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mono.dev","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### GET /api/payments

```bash
curl -s http://localhost:3001/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

Expected response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pay_03",
        "userId": "usr_01",
        "amount": 149.00,
        "currency": "EUR",
        "status": "refunded",
        "description": "Annual plan upgrade",
        "createdAt": "2026-03-10T14:00:00.000Z",
        "updatedAt": "2026-03-12T09:00:00.000Z"
      },
      {
        "id": "pay_01",
        "userId": "usr_01",
        "amount": 49.99,
        "currency": "USD",
        "status": "completed",
        "description": "Monthly subscription fee",
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-01-15T10:00:00.000Z"
      }
    ],
    "total": 2
  },
  "message": "OK"
}
```

### GET /api/payments/:id

```bash
curl -s http://localhost:3001/api/payments/pay_01 \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### GET /api/payments/:id — not found

```bash
curl -s http://localhost:3001/api/payments/pay_99 \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

Expected:

```json
{
  "success": false,
  "data": null,
  "message": "Payment pay_99 not found",
  "code": "NOTFOUND",
  "statusCode": 404
}
```

### POST /api/payments/:id/refund — full refund

```bash
curl -s -X POST http://localhost:3001/api/payments/pay_01/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq .
```

### POST /api/payments/:id/refund — partial refund

```bash
curl -s -X POST http://localhost:3001/api/payments/pay_01/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 19.99, "reason": "Partial cancellation"}' \
  | jq .
```

### POST /api/payments/:id/refund — already refunded (expect 400)

```bash
curl -s -X POST http://localhost:3001/api/payments/pay_03/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq .
```

Expected:

```json
{
  "success": false,
  "data": null,
  "message": "Payment has already been refunded",
  "code": "BADREQUEST",
  "statusCode": 400
}
```

### GET /api/payments — without token (expect 401)

```bash
curl -s http://localhost:3001/api/payments | jq .
```

Expected:

```json
{
  "success": false,
  "data": null,
  "message": "Missing token",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

---

## Step 6 — Add Shared Types for the Frontend

If the Next.js shell or any frontend package needs the payment types, add them to the shared types library.

Edit `libs/shared/types/src/index.ts` (or wherever shared types are exported):

```typescript
// Add payment status enum
export enum PaymentStatus {
  Pending   = 'pending',
  Completed = 'completed',
  Refunded  = 'refunded',
  Failed    = 'failed',
}

// Add payment shape for frontend use
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentList {
  items: Payment[];
  total: number;
}

export interface Refund {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
```

The `@mono/shared/types` package is already configured in `tsconfig.base.json` as a path alias. Frontend components import types with:

```typescript
import type { Payment, PaymentStatus } from '@mono/shared/types';
```

---

## Step 7 — Add a Path Alias (Only if Creating a New Library)

If you created a new library (e.g., `libs/payments/utils`) rather than adding to an existing library, register the path alias so TypeScript can resolve it.

Edit `tsconfig.base.json` in the monorepo root:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@mono/shared/types": ["libs/shared/types/src/index.ts"],
      "@mono/payments/utils": ["libs/payments/utils/src/index.ts"]  // ← new
    }
  }
}
```

Also add it to the `project.json` of packages that need to import it (Nx manages this if you used `nx generate library` — manual step if you created the library by hand).

---

## Step 8 — Switch to the Real Database

When the database schema is ready and `DATABASE_URL` is configured:

1. Edit `payments.module.ts`:

```typescript
// Remove or comment out:
// import { StaticPaymentRepository } from './repositories/static-payment.repository';

// Uncomment:
import { DrizzlePaymentRepository } from './repositories/drizzle-payment.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],   // ← required for DRIZZLE_DB token
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository },
  ],
})
export class PaymentsModule {}
```

2. Run migrations: `npm run db:migrate`
3. Seed the database: `npm run db:seed`
4. Restart the server

No other files change.

---

## What a Full PaymentsModule Directory Looks Like

```
apps/api-gateway/src/modules/payments/
├── payments.controller.ts          ← HTTP layer, Swagger decorators
├── payments.service.ts             ← Business logic, injects PAYMENT_REPOSITORY
├── payments.module.ts              ← DI bindings, imported by AppModule
├── dto/
│   ├── payment.dto.ts              ← PaymentDto, PaymentListDto, PaymentStatus
│   └── refund.dto.ts               ← RefundRequestDto, RefundDto
└── repositories/
    ├── payment.repository.interface.ts   ← IPaymentRepository + PAYMENT_REPOSITORY symbol
    ├── static-payment.repository.ts      ← In-memory dev implementation
    └── drizzle-payment.repository.ts     ← PostgreSQL production implementation
```

```
apps/api-gateway/src/database/schema/
├── index.ts               ← export { payments, type PaymentRow, type NewPaymentRow }
├── users.schema.ts        ← existing
└── payments.schema.ts     ← new
```

```
apps/api-gateway/src/app.module.ts
  └── imports: [PaymentsModule]   ← one line added
```
