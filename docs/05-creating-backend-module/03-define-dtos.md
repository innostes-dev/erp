# 03 — Define DTOs

DTOs (Data Transfer Objects) are plain TypeScript classes that describe the exact shape of data entering or leaving your API. NestJS's `ValidationPipe` transforms raw JSON into instances of these classes and runs all class-validator decorators automatically.

This guide covers request DTOs (with validation), response DTOs (without), nesting, and the complete `PaymentDto` / `RefundDto` examples.

---

## 1. How ValidationPipe Works

`ValidationPipe` is registered globally in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,            // Convert raw JSON to class instances
    whitelist: true,            // Strip any property not declared in the DTO
    forbidNonWhitelisted: true, // Throw 400 if an unknown property is sent
  }),
);
```

The pipeline:

1. Raw JSON arrives from the HTTP body
2. `ValidationPipe` instantiates the DTO class (because `transform: true`)
3. class-validator decorators run on every property
4. If any decorator fails → 400 Bad Request, never reaches the controller
5. If all pass → the controller receives a fully typed, validated DTO instance

Because `transform: true` is set, you can use type coercion. For example, a URL parameter that arrives as the string `"42"` can be declared as `@IsInt()` and `transform` will cast it to the number `42` before validation.

---

## 2. Request DTOs — Full Decorator Reference

Request DTOs carry `class-validator` decorators. Every public property must be annotated.

### Basic string / number / boolean

```typescript
import {
  IsString,
  IsEmail,
  IsNumber,
  IsInt,
  IsBoolean,
  IsPositive,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  IsISO8601,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentStatus {
  Pending   = 'pending',
  Completed = 'completed',
  Refunded  = 'refunded',
  Failed    = 'failed',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'usr_01', description: 'ID of the user making the payment' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 49.99, description: 'Payment amount in the specified currency' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code', minLength: 3, maxLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

  @ApiProperty({
    example: 'pending',
    enum: PaymentStatus,
    description: 'Initial status — must be pending',
  })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiPropertyOptional({
    example: 'Monthly subscription fee',
    description: 'Human-readable description (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### Key rules

| Situation | Decorators |
|---|---|
| Required string | `@IsString()` |
| Required email | `@IsEmail()` |
| Required positive decimal | `@IsNumber({ maxDecimalPlaces: 2 })`, `@IsPositive()` |
| Required integer | `@IsInt()`, `@Min(0)` |
| Enum value | `@IsEnum(PaymentStatus)` |
| Optional field | `@IsOptional()` (must be first), then type decorator |
| UUID | `@IsUUID('4')` |
| ISO 8601 date string | `@IsISO8601()` |
| Array of strings | `@IsArray()`, `@IsString({ each: true })` |
| Non-empty array | `@ArrayNotEmpty()` |
| URL | `@IsUrl()` |
| Length bounds | `@MinLength(n)`, `@MaxLength(n)` |
| Numeric bounds | `@Min(n)`, `@Max(n)` |

### `@IsOptional()` placement

`@IsOptional()` must be the **first** decorator on the property. If the field is absent from the request body, all other validators on that property are skipped. If the field is present, all validators run normally.

```typescript
// CORRECT — @IsOptional() first
@IsOptional()
@IsString()
@MaxLength(500)
description?: string;

// WRONG — @IsOptional() not first; string validation may still throw on undefined
@IsString()
@IsOptional()
description?: string;
```

---

## 3. Request DTO — RefundRequestDto

This DTO is used for `POST /api/payments/:id/refund`.

Create `apps/api-gateway/src/modules/payments/dto/refund.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class RefundRequestDto {
  @ApiPropertyOptional({
    example: 19.99,
    description:
      'Partial refund amount. If omitted the full payment amount is refunded.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    example: 'Customer requested cancellation',
    description: 'Reason for the refund (stored for audit trail)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
```

---

## 4. Response DTOs — No Validators Needed

Response DTOs describe what the API returns. They are used **only** for Swagger documentation and TypeScript types — they do not go through `ValidationPipe`. You do not need `class-validator` decorators on them.

Every property gets `@ApiProperty()` so Swagger renders a complete schema.

Create `apps/api-gateway/src/modules/payments/dto/payment.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from './refund.dto';

export class PaymentDto {
  @ApiProperty({ example: 'pay_01', description: 'Unique payment ID' })
  id!: string;

  @ApiProperty({ example: 'usr_01', description: 'ID of the user who made the payment' })
  userId!: string;

  @ApiProperty({ example: 49.99, description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  currency!: string;

  @ApiProperty({
    example: 'completed',
    enum: PaymentStatus,
    description: 'Current payment status',
  })
  status!: PaymentStatus;

  @ApiProperty({
    example: 'Monthly subscription fee',
    description: 'Human-readable description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: '2026-05-06T12:00:00.000Z',
    description: 'ISO 8601 creation timestamp',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-06T12:00:00.000Z',
    description: 'ISO 8601 last-updated timestamp',
  })
  updatedAt!: string;
}

export class PaymentListDto {
  @ApiProperty({ type: [PaymentDto], description: 'Array of payments' })
  items!: PaymentDto[];

  @ApiProperty({ example: 42, description: 'Total number of payments' })
  total!: number;
}
```

Add `RefundDto` to `refund.dto.ts`:

```typescript
// Append to apps/api-gateway/src/modules/payments/dto/refund.dto.ts

export class RefundDto {
  @ApiProperty({ example: 'ref_1746532800000', description: 'Unique refund ID' })
  refundId!: string;

  @ApiProperty({ example: 'pay_01', description: 'ID of the original payment' })
  paymentId!: string;

  @ApiProperty({ example: 19.99, description: 'Amount refunded' })
  amount!: number;

  @ApiProperty({
    example: 'pending',
    description: 'Refund status — transitions to completed asynchronously',
  })
  status!: 'pending' | 'completed' | 'failed';

  @ApiProperty({ example: '2026-05-06T12:00:00.000Z', description: 'ISO 8601 creation timestamp' })
  createdAt!: string;
}
```

---

## 5. Nested DTOs

When a response object contains another object, declare a separate class and reference it with `type`:

```typescript
export class PayerDto {
  @ApiProperty({ example: 'usr_01' })
  id!: string;

  @ApiProperty({ example: 'Jane Smith' })
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;
}

export class PaymentDetailDto extends PaymentDto {
  @ApiProperty({ type: PayerDto, description: 'User who made the payment' })
  payer!: PayerDto;
}
```

Swagger will expand `PayerDto` inline in the parent schema automatically because `type: PayerDto` refers to the class.

For arrays of nested objects:

```typescript
@ApiProperty({ type: [PaymentDto] })
items!: PaymentDto[];
```

The `[PaymentDto]` syntax (array literal) tells Swagger this is an array of that schema.

---

## 6. `@ApiProperty` Full Options Reference

```typescript
@ApiProperty({
  example: 'pay_01',        // Value shown in Swagger "Example Value"
  description: '...',       // Human-readable field description
  required: false,          // Marks as optional in schema (prefer @ApiPropertyOptional)
  nullable: true,           // Field can be null (include in TypeScript type too)
  enum: PaymentStatus,      // Renders as enum dropdown in Swagger
  type: [PaymentDto],       // Array of objects
  minimum: 0,               // Numeric minimum (mirrors validation)
  maximum: 1000000,         // Numeric maximum
  minLength: 3,             // String minimum length
  maxLength: 255,           // String maximum length
  default: 'USD',           // Default value hint (not enforced by NestJS)
})
```

`@ApiPropertyOptional()` is shorthand for `@ApiProperty({ required: false })`. Use it on optional request/response fields to keep the decorator line short.

---

## 7. DTO Inheritance

If multiple DTOs share common fields, use class inheritance:

```typescript
export class BasePaymentDto {
  @ApiProperty({ example: 'pay_01' })
  id!: string;

  @ApiProperty({ example: 49.99 })
  amount!: number;
}

export class PaymentDto extends BasePaymentDto {
  @ApiProperty({ example: 'USD' })
  currency!: string;

  // inherits id and amount from BasePaymentDto
}
```

NestJS Swagger correctly merges inherited properties.

---

## 8. Enum Handling

Define enums as TypeScript `const enum` or regular `enum`. Use `@IsEnum()` on request DTOs and `@ApiProperty({ enum: MyEnum })` on both:

```typescript
export enum PaymentStatus {
  Pending   = 'pending',
  Completed = 'completed',
  Refunded  = 'refunded',
  Failed    = 'failed',
}

// In request DTO:
@IsEnum(PaymentStatus)
status!: PaymentStatus;

// In response DTO:
@ApiProperty({ example: 'completed', enum: PaymentStatus })
status!: PaymentStatus;
```

Swagger renders a dropdown in the try-it-out form with the enum values listed.

---

## 9. Complete File — `payment.dto.ts`

```typescript
// apps/api-gateway/src/modules/payments/dto/payment.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  Pending   = 'pending',
  Completed = 'completed',
  Refunded  = 'refunded',
  Failed    = 'failed',
}

export class PaymentDto {
  @ApiProperty({ example: 'pay_01', description: 'Unique payment ID' })
  id!: string;

  @ApiProperty({ example: 'usr_01', description: 'ID of the user who made the payment' })
  userId!: string;

  @ApiProperty({ example: 49.99, description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  currency!: string;

  @ApiProperty({ example: 'completed', enum: PaymentStatus, description: 'Current payment status' })
  status!: PaymentStatus;

  @ApiProperty({
    example: 'Monthly subscription fee',
    description: 'Human-readable description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: '2026-05-06T12:00:00.000Z', description: 'ISO 8601 creation timestamp' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-06T12:00:00.000Z', description: 'ISO 8601 last-updated timestamp' })
  updatedAt!: string;
}

export class PaymentListDto {
  @ApiProperty({ type: [PaymentDto], description: 'Array of payments ordered by createdAt desc' })
  items!: PaymentDto[];

  @ApiProperty({ example: 42, description: 'Total number of matching payments' })
  total!: number;
}
```

---

## 10. Complete File — `refund.dto.ts`

```typescript
// apps/api-gateway/src/modules/payments/dto/refund.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

// ─── Request ─────────────────────────────────────────────────────────────────

export class RefundRequestDto {
  @ApiPropertyOptional({
    example: 19.99,
    description: 'Partial refund amount. Omit to refund the full payment amount.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    example: 'Customer requested cancellation',
    description: 'Reason stored for audit trail',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ─── Response ────────────────────────────────────────────────────────────────

export class RefundDto {
  @ApiProperty({ example: 'ref_1746532800000', description: 'Unique refund ID' })
  refundId!: string;

  @ApiProperty({ example: 'pay_01', description: 'ID of the original payment' })
  paymentId!: string;

  @ApiProperty({ example: 19.99, description: 'Amount that was refunded' })
  amount!: number;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'completed', 'failed'],
    description: 'Refund processing status',
  })
  status!: 'pending' | 'completed' | 'failed';

  @ApiProperty({ example: '2026-05-06T12:00:00.000Z', description: 'ISO 8601 creation timestamp' })
  createdAt!: string;
}
```

---

## 11. What Happens When Validation Fails

If a client sends an unknown field (e.g., `"adminOverride": true`), `ValidationPipe` throws:

```json
{
  "success": false,
  "data": null,
  "message": "property adminOverride should not exist",
  "code": "BADREQUEST",
  "statusCode": 400
}
```

If a required field is missing:

```json
{
  "success": false,
  "data": null,
  "message": "amount must be a positive number",
  "code": "BADREQUEST",
  "statusCode": 400
}
```

Multiple failures are reported together — the `message` field may be an array of strings in this case (NestJS default). `AllExceptionsFilter` normalizes it to a single string.
