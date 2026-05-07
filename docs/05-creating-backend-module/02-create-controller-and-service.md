# 02 — Create Controller and Service

This guide walks through creating a complete `PaymentsModule` from scratch. By the end you will have:

- `GET /api/payments` — returns a paginated list of payments (JWT-protected)
- `POST /api/payments/:id/refund` — initiates a refund on a payment (JWT-protected)

All code shown is production-ready and matches the patterns used by the existing `AuthModule`.

---

## Prerequisites

Read [01 — Overview](./01-overview.md) before continuing. You need to understand:

- What `TransformInterceptor`, `AllExceptionsFilter`, and `JwtAuthGuard` do
- Why services inject `PAYMENT_REPOSITORY` instead of a concrete class
- How `ValidationPipe` processes DTOs

---

## Step 1 — Create the Directory Structure

```bash
mkdir -p apps/api-gateway/src/modules/payments/dto
mkdir -p apps/api-gateway/src/modules/payments/repositories
```

Final structure after all steps:

```
apps/api-gateway/src/modules/payments/
├── payments.controller.ts
├── payments.service.ts
├── payments.module.ts
├── dto/
│   ├── payment.dto.ts
│   └── refund.dto.ts
└── repositories/
    ├── payment.repository.interface.ts
    ├── static-payment.repository.ts
    └── drizzle-payment.repository.ts
```

---

## Step 2 — Create the Controller

Create `apps/api-gateway/src/modules/payments/payments.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentDto, PaymentListDto } from './dto/payment.dto';
import { RefundRequestDto, RefundDto } from './dto/refund.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── GET /api/payments ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List payments',
    description:
      'Returns all payments visible to the authenticated user. ' +
      'Results are ordered by creation date descending.',
  })
  @ApiOkResponse({
    type: PaymentListDto,
    description: 'Payments retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async findAll(): Promise<PaymentListDto> {
    return this.paymentsService.findAll();
  }

  // ─── GET /api/payments/:id ───────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get a payment',
    description: 'Returns a single payment by its ID.',
  })
  @ApiParam({ name: 'id', example: 'pay_01', description: 'Payment ID' })
  @ApiOkResponse({ type: PaymentDto, description: 'Payment found' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async findOne(@Param('id') id: string): Promise<PaymentDto> {
    return this.paymentsService.findById(id);
  }

  // ─── POST /api/payments/:id/refund ──────────────────────────────────────────

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refund a payment',
    description:
      'Initiates a full or partial refund for the specified payment. ' +
      'Partial refunds require an `amount` field. ' +
      'Returns the created refund record.',
  })
  @ApiParam({ name: 'id', example: 'pay_01', description: 'Payment to refund' })
  @ApiOkResponse({ type: RefundDto, description: 'Refund initiated successfully' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiBadRequestResponse({
    description:
      'Invalid request — e.g. amount exceeds original payment, or payment is not refundable',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async refund(
    @Param('id') id: string,
    @Body() dto: RefundRequestDto,
  ): Promise<RefundDto> {
    return this.paymentsService.refund(id, dto);
  }
}
```

### What every decorator does

| Decorator | Where | Effect |
|---|---|---|
| `@ApiTags('payments')` | Class | Groups all routes under "payments" in Swagger UI |
| `@ApiBearerAuth()` | Class | Adds the lock icon to every method — no need to repeat per method |
| `@Controller('payments')` | Class | Mounts all routes under `/api/payments` (global `api` prefix added by `main.ts`) |
| `@ApiOperation({ summary, description })` | Method | Shown as the route title and tooltip in Swagger |
| `@ApiOkResponse({ type })` | Method | Documents the 200 response schema; NestJS reflects `PaymentDto` to build it |
| `@ApiCreatedResponse({ type })` | Method | Same but for 201 — use on `@Post` routes that create resources |
| `@ApiNotFoundResponse` | Method | Documents the 404 shape (uses `AllExceptionsFilter` envelope) |
| `@ApiBadRequestResponse` | Method | Documents 400 |
| `@ApiUnauthorizedResponse` | Method | Documents 401 |
| `@ApiParam` | Method | Documents a path parameter in Swagger |
| `@HttpCode(HttpStatus.OK)` | Method | Overrides NestJS's default 201 for `@Post` to return 200 |
| `@Param('id')` | Parameter | Extracts `:id` from the URL |
| `@Body()` | Parameter | Binds and validates the request body against the DTO class |

---

## Step 3 — Create the Service

Create `apps/api-gateway/src/modules/payments/payments.service.ts`:

```typescript
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PAYMENT_REPOSITORY,
  type IPaymentRepository,
} from './repositories/payment.repository.interface';
import { PaymentDto, PaymentListDto } from './dto/payment.dto';
import { RefundRequestDto, RefundDto } from './dto/refund.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  // ─── findAll ────────────────────────────────────────────────────────────────

  async findAll(): Promise<PaymentListDto> {
    const rows = await this.repo.findAll();
    return {
      items: rows.map((r) => this.toDto(r)),
      total: rows.length,
    };
  }

  // ─── findById ───────────────────────────────────────────────────────────────

  async findById(id: string): Promise<PaymentDto> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return this.toDto(row);
  }

  // ─── refund ─────────────────────────────────────────────────────────────────

  async refund(id: string, dto: RefundRequestDto): Promise<RefundDto> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    if (row.status === 'refunded') {
      throw new BadRequestException('Payment has already been refunded');
    }

    if (row.status !== 'completed') {
      throw new BadRequestException(
        `Only completed payments can be refunded (current status: ${row.status})`,
      );
    }

    const refundAmount = dto.amount ?? row.amount;
    if (refundAmount > row.amount) {
      throw new BadRequestException(
        `Refund amount ${refundAmount} exceeds payment amount ${row.amount}`,
      );
    }

    const refunded = await this.repo.update(id, { status: 'refunded' });
    if (!refunded) {
      throw new NotFoundException(`Payment ${id} not found after update`);
    }

    return {
      refundId: `ref_${Date.now()}`,
      paymentId: id,
      amount: refundAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private toDto(row: Awaited<ReturnType<IPaymentRepository['findById']>> & {}): PaymentDto {
    return {
      id: row.id,
      userId: row.userId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      description: row.description ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
```

---

## Step 4 — HttpException Subclasses

NestJS ships with named exception classes for every common HTTP status code. Throw these from the service — `AllExceptionsFilter` catches them and formats the error envelope automatically.

```typescript
import {
  NotFoundException,       // 404
  BadRequestException,     // 400
  UnauthorizedException,   // 401
  ForbiddenException,      // 403
  ConflictException,       // 409
  UnprocessableEntityException, // 422
  InternalServerErrorException, // 500
} from '@nestjs/common';
```

### Usage examples

```typescript
// 404 — resource not found
throw new NotFoundException(`Payment ${id} not found`);

// 400 — caller sent invalid data that passed DTO validation but fails business rules
throw new BadRequestException('Refund amount exceeds original payment');

// 403 — caller is authenticated but not allowed to perform this action
throw new ForbiddenException('You do not have permission to refund this payment');

// 409 — state conflict
throw new ConflictException('A refund is already in progress for this payment');
```

What the client receives (formatted by `AllExceptionsFilter`):

```json
{
  "success": false,
  "data": null,
  "message": "Payment pay_99 not found",
  "code": "NOTFOUND",
  "statusCode": 404
}
```

The `code` field is derived from the exception class name: `NotFoundException` → `NOTFOUND`, `BadRequestException` → `BADREQUEST`, `ForbiddenException` → `FORBIDDEN`.

### When to throw which exception

| Situation | Exception |
|---|---|
| Record does not exist in the DB | `NotFoundException` |
| Request body or param is semantically invalid | `BadRequestException` |
| User is not logged in | `UnauthorizedException` |
| User is logged in but not permitted to do this | `ForbiddenException` |
| Duplicate resource would be created | `ConflictException` |
| External service returned an unexpected error | `InternalServerErrorException` |

### Do NOT throw from the controller

All exception throwing happens in the service, never in the controller. The controller's only job is to pass validated data to the service and return what the service gives back. This keeps the controller thin and the business rules testable in isolation.

---

## Step 5 — Verify the Route URLs

With `app.setGlobalPrefix('api')` and `@Controller('payments')`:

| Decorator | Final URL |
|---|---|
| `@Get()` | `GET /api/payments` |
| `@Get(':id')` | `GET /api/payments/:id` |
| `@Post(':id/refund')` | `POST /api/payments/:id/refund` |

If a route is nested further (e.g., a sub-controller), add the path segment: `@Get('summary/monthly')` → `GET /api/payments/summary/monthly`.

---

## Step 6 — Wire the Module

The controller and service are not active until declared in a module. Continue to [04 — Repository Pattern](./04-repository-pattern.md) to create the repository, then [07 — Wire Into App](./07-wire-into-app.md) to register everything.

The minimal module file looks like this (full version in guide 07):

```typescript
// apps/api-gateway/src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StaticPaymentRepository } from './repositories/static-payment.repository';
import { PAYMENT_REPOSITORY } from './repositories/payment.repository.interface';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository },
  ],
})
export class PaymentsModule {}
```

---

## Common Mistakes

### Mistake: Business logic in the controller

```typescript
// WRONG — never do this
@Get(':id')
async findOne(@Param('id') id: string) {
  const row = await this.repo.findById(id);  // controller touching repo directly
  if (!row) throw new NotFoundException();   // error logic in controller
  return row;
}

// CORRECT — delegate entirely to service
@Get(':id')
async findOne(@Param('id') id: string): Promise<PaymentDto> {
  return this.paymentsService.findById(id);
}
```

### Mistake: Returning the raw DB row from the controller

Raw DB rows may contain sensitive fields (e.g., `passwordHash`). Always map to a DTO in the service before returning.

### Mistake: Forgetting `@HttpCode(HttpStatus.OK)` on a `@Post` that returns data

NestJS defaults `@Post` to HTTP 201. If your endpoint is an action (not a resource creation — e.g., `/refund`, `/cancel`, `/approve`), use `@HttpCode(HttpStatus.OK)` to return 200.

### Mistake: Not adding `@ApiBearerAuth()` at the class level

Without it, Swagger will not show the authorization lock icon and testers will get 401 when trying the endpoint from the docs UI. Add it at the class level so all methods inherit it.
