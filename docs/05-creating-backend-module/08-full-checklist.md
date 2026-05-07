# 08 — Full Checklist

Use this checklist when creating any new backend module. Every section lists exact file paths, what to create or modify, and how to verify. Work through it top to bottom.

---

## Phase 1 — Schema (Skip if using StaticRepository only)

- [ ] **Create schema file**
  - Path: `apps/api-gateway/src/database/schema/payments.schema.ts`
  - Define `pgTable`, column builders, `.primaryKey()`, `.notNull()`, `.defaultNow()`
  - Export `type PaymentRow = typeof payments.$inferSelect`
  - Export `type NewPaymentRow = typeof payments.$inferInsert`

- [ ] **Export from schema barrel**
  - Path: `apps/api-gateway/src/database/schema/index.ts`
  - Add: `export { payments, type PaymentRow, type NewPaymentRow } from './payments.schema';`

- [ ] **Verify TypeScript compiles**
  - Command: `pnpm --filter @mono/api-gateway tsc --noEmit`
  - Expected: zero errors

- [ ] **Generate migration**
  - Command: `npm run db:generate`
  - Expected: new `.sql` file in `apps/api-gateway/drizzle/`

- [ ] **Apply migration**
  - Command: `npm run db:migrate`
  - Expected: `payments` table created in DB

- [ ] **Add to seed script**
  - Path: `apps/api-gateway/src/database/seed.ts`
  - Add `.values([...]).onConflictDoNothing()` block for payments
  - Command: `npm run db:seed`

---

## Phase 2 — Repository Layer

- [ ] **Create directory**
  - Path: `apps/api-gateway/src/modules/payments/repositories/`

- [ ] **Create interface + DI token**
  - Path: `apps/api-gateway/src/modules/payments/repositories/payment.repository.interface.ts`
  - Must export: `IPaymentRepository` interface with `findAll`, `findById`, `create`, `update`
  - Must export: `export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');`

- [ ] **Create static repository**
  - Path: `apps/api-gateway/src/modules/payments/repositories/static-payment.repository.ts`
  - Decorator: `@Injectable()`
  - Implements: `IPaymentRepository`
  - All methods async, no imports from drizzle-orm
  - `STATIC_PAYMENTS` array has at least 2-3 representative rows

- [ ] **Create Drizzle repository**
  - Path: `apps/api-gateway/src/modules/payments/repositories/drizzle-payment.repository.ts`
  - Decorator: `@Injectable()`
  - Implements: `IPaymentRepository`
  - Injects: `@Inject(DRIZZLE_DB) private readonly db: DrizzleDB`
  - Imports `payments` table and types from `'../../../database/schema'`

---

## Phase 3 — DTOs

- [ ] **Create DTO directory**
  - Path: `apps/api-gateway/src/modules/payments/dto/`

- [ ] **Create request DTOs**
  - Path: `apps/api-gateway/src/modules/payments/dto/refund.dto.ts`
  - `RefundRequestDto`: all optional fields with `@IsOptional()` first, then type validators
  - Every field has `@ApiProperty()` or `@ApiPropertyOptional()`

- [ ] **Create response DTOs**
  - Path: `apps/api-gateway/src/modules/payments/dto/payment.dto.ts`
  - `PaymentDto`: all public fields with `@ApiProperty()`
  - `PaymentListDto`: `items: PaymentDto[]` and `total: number`
  - `RefundDto` (in `refund.dto.ts`): `refundId`, `paymentId`, `amount`, `status`, `createdAt`

- [ ] **Define enum** (if needed)
  - `PaymentStatus` enum in `payment.dto.ts`
  - Use string values: `Pending = 'pending'`, etc.
  - Apply `@ApiProperty({ enum: PaymentStatus })` wherever used

---

## Phase 4 — Service

- [ ] **Create service**
  - Path: `apps/api-gateway/src/modules/payments/payments.service.ts`
  - Decorator: `@Injectable()`
  - Constructor: `@Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository`
  - No imports from `drizzle-orm` or database layer
  - Throws `NotFoundException` when record not found
  - Throws `BadRequestException` for invalid business operations
  - Maps raw rows to DTOs via a private `toDto()` method

---

## Phase 5 — Controller

- [ ] **Create controller**
  - Path: `apps/api-gateway/src/modules/payments/payments.controller.ts`
  - Class decorators: `@ApiTags('payments')`, `@ApiBearerAuth()`, `@Controller('payments')`
  - Every route method has `@ApiOperation({ summary, description })`
  - Every route method has at least one `@ApiXxxResponse` decorator
  - `@Post` action routes (non-create): `@HttpCode(HttpStatus.OK)`
  - `@Delete` routes: `@HttpCode(HttpStatus.NO_CONTENT)`
  - No business logic — every method delegates to service in one line
  - All return types are typed (no `any`)

---

## Phase 6 — Module File

- [ ] **Create module**
  - Path: `apps/api-gateway/src/modules/payments/payments.module.ts`
  - `controllers: [PaymentsController]`
  - `providers: [PaymentsService, { provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }]`
  - `imports: [DatabaseModule]` commented out (uncomment when switching to Drizzle)

---

## Phase 7 — Wire into App

- [ ] **Import PaymentsModule in AppModule**
  - Path: `apps/api-gateway/src/app.module.ts`
  - Add `import { PaymentsModule } from './modules/payments/payments.module';`
  - Add `PaymentsModule` to the `imports` array

---

## Phase 8 — Verification

- [ ] **TypeScript check**
  ```bash
  pnpm --filter @mono/api-gateway tsc --noEmit
  ```
  Expected: zero errors

- [ ] **Start server**
  ```bash
  pnpm nx run api-gateway:serve
  ```
  Expected: server starts on port 3001, no runtime errors in console

- [ ] **Swagger UI**
  - Open `http://localhost:3001/api/docs`
  - Confirm "payments" group in sidebar
  - Confirm all routes visible
  - Confirm lock icon on protected routes

- [ ] **curl — unauthenticated (expect 401)**
  ```bash
  curl -s http://localhost:3001/api/payments | jq .
  # Expected: { "success": false, "code": "UNAUTHORIZED", "statusCode": 401 }
  ```

- [ ] **curl — get token**
  ```bash
  TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@mono.dev","password":"admin123"}' \
    | jq -r '.data.token')
  ```

- [ ] **curl — list payments (expect 200)**
  ```bash
  curl -s http://localhost:3001/api/payments \
    -H "Authorization: Bearer $TOKEN" | jq .
  # Expected: { "success": true, "data": { "items": [...], "total": N } }
  ```

- [ ] **curl — get single payment (expect 200)**
  ```bash
  curl -s http://localhost:3001/api/payments/pay_01 \
    -H "Authorization: Bearer $TOKEN" | jq .
  ```

- [ ] **curl — get non-existent payment (expect 404)**
  ```bash
  curl -s http://localhost:3001/api/payments/pay_99 \
    -H "Authorization: Bearer $TOKEN" | jq .
  # Expected: { "success": false, "code": "NOTFOUND", "statusCode": 404 }
  ```

- [ ] **curl — refund (expect 200)**
  ```bash
  curl -s -X POST http://localhost:3001/api/payments/pay_01/refund \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 19.99}' | jq .
  ```

- [ ] **curl — refund already-refunded (expect 400)**
  ```bash
  curl -s -X POST http://localhost:3001/api/payments/pay_03/refund \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | jq .
  # Expected: { "success": false, "code": "BADREQUEST", "statusCode": 400 }
  ```

- [ ] **curl — unknown request body field (expect 400)**
  ```bash
  curl -s -X POST http://localhost:3001/api/payments/pay_01/refund \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"adminOverride": true}' | jq .
  # Expected: 400 — "property adminOverride should not exist"
  ```

---

## Phase 9 — Shared Types (Optional)

- [ ] **Add types to shared library** (if frontend needs them)
  - Path: `libs/shared/types/src/index.ts`
  - Export `Payment`, `PaymentList`, `Refund`, `PaymentStatus`

- [ ] **Add path alias** (only if creating a new library)
  - Path: `tsconfig.base.json`
  - Add entry under `compilerOptions.paths`

---

## Common Errors and Fixes

### Error: `Nest can't resolve dependencies of the PaymentsService`

**Cause**: `PAYMENT_REPOSITORY` is not provided in the module.

**Fix**: Ensure `payments.module.ts` includes:
```typescript
{ provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }
```

### Error: `Nest can't resolve dependencies of the DrizzlePaymentRepository — DRIZZLE_DB`

**Cause**: `DrizzlePaymentRepository` is active but `DatabaseModule` is not imported.

**Fix**: Add `DatabaseModule` to the `imports` array in `payments.module.ts`.

### Error: `Cannot read properties of undefined (reading 'select')`

**Cause**: `payments` table is imported from `schema/index.ts` but not exported there.

**Fix**: Edit `schema/index.ts` and add `export { payments, ... } from './payments.schema';`.

### Error: 401 on all routes even with valid token

**Cause**: Route is missing `@ApiBearerAuth()` on the controller class (Swagger display issue only — won't fix 401).

**Real cause of 401**: The token you are using is stale (server restarted and cleared the in-memory session map). Re-login to get a fresh token.

### Error: 400 "property X should not exist"

**Cause**: `ValidationPipe` with `forbidNonWhitelisted: true` rejected an unknown field.

**Fix**: Remove the unexpected field from the request body, or add the field to the DTO with `@ApiPropertyOptional()` and the appropriate validator.

### Error: Response body has no `data` wrapper

**Cause**: The controller is returning data but `TransformInterceptor` is not active.

**Fix**: Ensure `TransformInterceptor` is registered in `AppModule` as `APP_INTERCEPTOR` and not accidentally overridden in the module.

### Error: Swagger shows route but not the request body schema

**Cause**: The `@Body()` parameter type is `any` or an interface (not a class).

**Fix**: Declare the body type as a class DTO. Interfaces are erased at runtime and cannot be reflected by Swagger.

### Error: `npm run db:generate` shows no changes

**Cause**: The schema file was created but not exported from `schema/index.ts`, so Drizzle does not see the new table.

**Fix**: Add the export to `schema/index.ts` and re-run `db:generate`.

### Error: TypeScript — `IPaymentRepository` property X is missing in `StaticPaymentRepository`

**Cause**: You added a method to the interface but forgot to implement it in one or both repository classes.

**Fix**: Implement the method in both `StaticPaymentRepository` and `DrizzlePaymentRepository`. TypeScript will show you exactly which methods are missing.

---

## File Manifest — Complete List

```
NEW FILES:
  apps/api-gateway/src/modules/payments/payments.controller.ts
  apps/api-gateway/src/modules/payments/payments.service.ts
  apps/api-gateway/src/modules/payments/payments.module.ts
  apps/api-gateway/src/modules/payments/dto/payment.dto.ts
  apps/api-gateway/src/modules/payments/dto/refund.dto.ts
  apps/api-gateway/src/modules/payments/repositories/payment.repository.interface.ts
  apps/api-gateway/src/modules/payments/repositories/static-payment.repository.ts
  apps/api-gateway/src/modules/payments/repositories/drizzle-payment.repository.ts
  apps/api-gateway/src/database/schema/payments.schema.ts

MODIFIED FILES:
  apps/api-gateway/src/database/schema/index.ts          (add export)
  apps/api-gateway/src/app.module.ts                     (add PaymentsModule to imports)
  apps/api-gateway/src/database/seed.ts                  (add payments seed)
  libs/shared/types/src/index.ts                         (add Payment types — optional)
```
