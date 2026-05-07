# 06 — Swagger Documentation

Swagger UI is available at `http://localhost:3001/api/docs` in development. It is auto-generated from decorators — no YAML or JSON files to maintain. This guide covers every decorator you need for a fully documented controller.

---

## 1. How Swagger is Set Up in This Project

`main.ts` initialises Swagger once, when `NODE_ENV !== 'production'`:

```typescript
const swaggerConfig = new DocumentBuilder()
  .setTitle('Mono API Gateway')
  .setDescription('...')
  .setVersion('1.0')
  .addBearerAuth()          // Enables the "Authorize" button in Swagger UI
  .addTag('auth', '...')    // Creates a named group in the sidebar
  .addTag('health', '...')
  .build();

SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
});
```

When you add `@ApiTags('payments')` to a controller, Swagger automatically creates a "payments" section in the sidebar — you do not need to call `addTag()` in `main.ts` unless you want to add a description to the group.

---

## 2. Class-Level Decorators

These decorators go on the controller class and apply to all methods unless overridden.

```typescript
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

@ApiTags('payments')      // Groups routes under "payments" in Swagger UI
@ApiBearerAuth()          // Shows the lock icon; prompts for token in Swagger UI
@Controller('payments')   // Not a Swagger decorator — sets the route prefix
export class PaymentsController { ... }
```

| Decorator | Description |
|---|---|
| `@ApiTags('payments')` | Places all routes in the controller under the "payments" group in Swagger |
| `@ApiBearerAuth()` | Marks all routes as requiring Bearer authentication. The Swagger "Authorize" button populates the header automatically after login |
| `@ApiExcludeController()` | Hides the entire controller from Swagger (useful for internal endpoints) |

---

## 3. Method-Level Decorators

These decorators go on individual route handler methods.

### `@ApiOperation` — Route title and description

```typescript
@ApiOperation({
  summary: 'List payments',
  description:
    'Returns all payments visible to the authenticated user. ' +
    'Results are ordered by creation date descending.',
})
@Get()
async findAll(): Promise<PaymentListDto> { ... }
```

- `summary`: Short label shown in the collapsed route card
- `description`: Full description shown when the route is expanded. Supports Markdown

### `@ApiOkResponse` — 200 response

```typescript
@ApiOkResponse({
  type: PaymentListDto,
  description: 'Payments retrieved successfully',
})
```

`type: PaymentListDto` tells Swagger to reflect the class and generate a full JSON schema. Every `@ApiProperty()` on `PaymentListDto` (and nested classes) is included.

### `@ApiCreatedResponse` — 201 response

```typescript
@ApiCreatedResponse({
  type: PaymentDto,
  description: 'Payment created',
})
```

Use this on `@Post` routes that create a new resource. NestJS defaults `@Post` to HTTP 201 (unless overridden with `@HttpCode`).

### `@ApiNotFoundResponse` — 404 response

```typescript
@ApiNotFoundResponse({ description: 'Payment not found' })
```

The response body shape is the `AllExceptionsFilter` envelope — Swagger will not auto-generate it unless you add `@ApiResponse({ status: 404, type: ErrorResponseDto })` with a custom ErrorResponseDto class.

### `@ApiUnauthorizedResponse` — 401 response

```typescript
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
```

### `@ApiBadRequestResponse` — 400 response

```typescript
@ApiBadRequestResponse({
  description: 'Validation failed — check the request body',
})
```

### `@ApiNoContentResponse` — 204 response

```typescript
@ApiNoContentResponse({ description: 'Payment deleted' })
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async delete(@Param('id') id: string): Promise<void> { ... }
```

### `@HttpCode` — Override the default status code

```typescript
@HttpCode(HttpStatus.OK)        // Override POST's default 201 to 200
@HttpCode(HttpStatus.NO_CONTENT) // 204 — no body returned
```

### `@ApiParam` — Path parameters

```typescript
@ApiParam({
  name: 'id',
  example: 'pay_01',
  description: 'Unique payment ID',
  required: true,
})
@Get(':id')
```

### `@ApiQuery` — Query string parameters

```typescript
@ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
@ApiQuery({ name: 'limit', type: Number, example: 20, required: false })
@Get()
async findAll(
  @Query('status') status?: PaymentStatus,
  @Query('limit') limit?: number,
) { ... }
```

### `@ApiBody` — Explicit body documentation (rarely needed)

NestJS reflects the DTO class from the `@Body()` parameter automatically. You only need `@ApiBody` if the body type cannot be inferred (e.g., union types):

```typescript
@ApiBody({ type: RefundRequestDto })
@Post(':id/refund')
async refund(@Param('id') id: string, @Body() dto: RefundRequestDto) { ... }
```

### `@ApiExcludeEndpoint` — Hide a route from Swagger

```typescript
@ApiExcludeEndpoint()
@Get('internal/health-token')  // internal — not for external consumers
async internalHealthToken() { ... }
```

---

## 4. DTO-Level Decorators

DTO properties are documented with `@ApiProperty()` and `@ApiPropertyOptional()`.

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty({
    example: 'pay_01',
    description: 'Unique payment ID',
  })
  id!: string;

  @ApiProperty({
    example: 49.99,
    description: 'Payment amount',
    minimum: 0,
    maximum: 999999.99,
  })
  amount!: number;

  @ApiProperty({
    example: 'completed',
    enum: PaymentStatus,
    description: 'Current payment status',
  })
  status!: PaymentStatus;

  @ApiProperty({
    example: 'Monthly subscription fee',
    nullable: true,
    description: 'Human-readable description — may be null',
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'proc_stripe_123',
    description: 'External processor transaction ID',
  })
  processorId?: string;
}
```

### `@ApiProperty` options

| Option | Type | Purpose |
|---|---|---|
| `example` | any | Value shown in the "Example Value" tab |
| `description` | string | Shown as field description in Swagger |
| `required` | boolean | Marks field as optional in schema |
| `nullable` | boolean | Field may be null (`string \| null`) |
| `enum` | enum type | Renders a dropdown in Swagger try-it-out |
| `type` | class or `[class]` | Reference to nested DTO or array of DTOs |
| `minimum` | number | JSON Schema minimum for numeric fields |
| `maximum` | number | JSON Schema maximum |
| `minLength` | number | JSON Schema minLength for string fields |
| `maxLength` | number | JSON Schema maxLength |
| `default` | any | Default value hint (not enforced at runtime) |
| `isArray` | boolean | Marks the property as an array (alternative to `type: [Dto]`) |

`@ApiPropertyOptional()` is shorthand for `@ApiProperty({ required: false })`.

---

## 5. Complete Annotated Controller Example

This is a production-quality example combining all decorators described above:

```typescript
// apps/api-gateway/src/modules/payments/payments.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentDto, PaymentListDto, PaymentStatus } from './dto/payment.dto';
import { RefundRequestDto, RefundDto } from './dto/refund.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── GET /api/payments ─────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List payments',
    description:
      'Returns all payments for the authenticated user. ' +
      'Filter by status using the `status` query parameter.',
  })
  @ApiQuery({
    name: 'status',
    enum: PaymentStatus,
    required: false,
    description: 'Filter payments by status',
  })
  @ApiOkResponse({ type: PaymentListDto, description: 'Payments retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async findAll(@Query('status') status?: PaymentStatus): Promise<PaymentListDto> {
    return this.paymentsService.findAll(status);
  }

  // ─── GET /api/payments/:id ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get a payment',
    description: 'Returns a single payment record by its unique ID.',
  })
  @ApiParam({ name: 'id', example: 'pay_01', description: 'Unique payment ID' })
  @ApiOkResponse({ type: PaymentDto, description: 'Payment found' })
  @ApiNotFoundResponse({ description: 'Payment with the given ID does not exist' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async findOne(@Param('id') id: string): Promise<PaymentDto> {
    return this.paymentsService.findById(id);
  }

  // ─── POST /api/payments/:id/refund ─────────────────────────────────────────

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refund a payment',
    description:
      'Initiates a refund for a completed payment. ' +
      'For partial refunds, include the `amount` field. ' +
      'Omit `amount` to refund the full payment.',
  })
  @ApiParam({ name: 'id', example: 'pay_01', description: 'ID of the payment to refund' })
  @ApiOkResponse({ type: RefundDto, description: 'Refund initiated successfully' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiBadRequestResponse({
    description: 'Payment is not refundable, or amount exceeds original payment',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async refund(
    @Param('id') id: string,
    @Body() dto: RefundRequestDto,
  ): Promise<RefundDto> {
    return this.paymentsService.refund(id, dto);
  }

  // ─── DELETE /api/payments/:id ──────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a payment',
    description: 'Permanently removes a payment record. This action cannot be undone.',
  })
  @ApiParam({ name: 'id', example: 'pay_01', description: 'Unique payment ID' })
  @ApiNoContentResponse({ description: 'Payment deleted — no response body' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.paymentsService.delete(id);
  }
}
```

---

## 6. Adding a New Tag to the Swagger Sidebar Description

By default, `@ApiTags('payments')` adds the tag without a description. To add a description, edit `main.ts`:

```typescript
const swaggerConfig = new DocumentBuilder()
  // ...
  .addTag('payments', 'Payment lifecycle — create, refund, query payment records')
  .build();
```

This is optional. Tags without descriptions still appear in the sidebar — they just have no tooltip.

---

## 7. Checking the Swagger Output

After wiring the module into `AppModule` (see [07 — Wire Into App](./07-wire-into-app.md)) and starting the server, navigate to `http://localhost:3001/api/docs`.

Verify:

- [ ] "payments" group appears in the left sidebar
- [ ] Each route shows a `GET`/`POST`/`DELETE` badge with the correct URL
- [ ] Clicking a route expands it to show `summary`, `description`, and parameter docs
- [ ] The lock icon appears on routes with `@ApiBearerAuth()`
- [ ] "Schemas" section at the bottom shows `PaymentDto`, `PaymentListDto`, `RefundRequestDto`, `RefundDto`
- [ ] Each schema field shows `example` and `description`
- [ ] Try "Execute" on `GET /api/payments` — it should return 401 without a token
- [ ] Click "Authorize", paste the token from `POST /api/auth/login`, then retry — it should return 200

---

## 8. Common Swagger Mistakes

### Mistake: Missing `@ApiProperty()` on response DTO fields

If a field has no `@ApiProperty()`, Swagger omits it from the schema. The field is still returned at runtime — it just does not appear in the docs. Add `@ApiProperty()` to every public field in response DTOs.

### Mistake: `type: PaymentDto` vs `type: [PaymentDto]`

```typescript
// WRONG — documents a single PaymentDto, but the method returns an array
@ApiOkResponse({ type: PaymentDto })
async findAll(): Promise<PaymentDto[]> { ... }

// CORRECT — array syntax
@ApiOkResponse({ type: [PaymentDto] })
async findAll(): Promise<PaymentDto[]> { ... }

// CORRECT — or use a wrapper DTO (preferred for pagination metadata)
@ApiOkResponse({ type: PaymentListDto })
async findAll(): Promise<PaymentListDto> { ... }
```

### Mistake: Not using `@ApiParam` for path parameters

Without `@ApiParam`, Swagger cannot tell the user what format the parameter should be in. Always add it for clarity.

### Mistake: `@HttpCode` and `@ApiXxxResponse` disagreeing

If you use `@HttpCode(HttpStatus.OK)` but decorate with `@ApiCreatedResponse`, Swagger tells users to expect 201 but the server returns 200. Keep the decorator and the code in sync:

```typescript
// CORRECT
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ type: RefundDto })

// ALSO CORRECT (default POST behavior)
// no @HttpCode — defaults to 201
@ApiCreatedResponse({ type: PaymentDto })
```
