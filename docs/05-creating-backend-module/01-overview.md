# 01 — NestJS Module Overview

This document explains the core building blocks of the NestJS backend inside this monorepo before you write a single line of code for a new module. Read it once, refer back to the diagrams whenever something does not behave as expected.

---

## 1. What is a NestJS Module?

A **module** is the fundamental organizational unit in NestJS. Every feature you build lives inside a module. A module is a class decorated with `@Module()` that declares:

| Decorator field | Purpose |
|---|---|
| `imports` | Other modules whose exported providers this module needs |
| `controllers` | HTTP handler classes that belong to this module |
| `providers` | Services, repositories, guards, and any other injectable classes |
| `exports` | Providers that other modules can inject (opt-in sharing) |

NestJS builds a **dependency-injection (DI) container** from the module graph at startup. Every provider registered in a module is instantiated once (singleton scope by default) and injected wherever it is requested.

---

## 2. The Three Core Files of Every Feature Module

Every module in this codebase follows the same three-file anatomy:

```
modules/payments/
├── payments.controller.ts   ← HTTP layer: routes, Swagger, DTO validation
├── payments.service.ts      ← Business logic, calls the repository
└── payments.module.ts       ← Wires controller + service + repository together
```

Additional sub-directories appear when a module grows:

```
modules/payments/
├── dto/
│   ├── payment.dto.ts        ← request/response shapes
│   └── refund.dto.ts
└── repositories/
    ├── payment.repository.interface.ts
    ├── static-payment.repository.ts
    └── drizzle-payment.repository.ts
```

### Controller

The controller is the HTTP boundary. It declares routes with `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`. It is responsible for:

- Accepting a validated, transformed DTO from `ValidationPipe`
- Delegating to the service for all business logic
- Returning data — the `TransformInterceptor` wraps it automatically

Controllers **never** contain business logic. They do not touch the database or the repository directly.

### Service

The service contains business logic. It is decorated with `@Injectable()` and injected into the controller. It:

- Calls the repository to read and write data
- Throws NestJS `HttpException` subclasses when something goes wrong
- Has no knowledge of HTTP — it works entirely with plain TypeScript objects

### Module

The module file declares what classes exist and how they relate to each other. It provides repository bindings (which concrete class satisfies `PAYMENT_REPOSITORY`) and imports any external modules the service depends on.

---

## 3. Dependency Injection in Detail

NestJS uses constructor injection. When a class lists a parameter in its constructor, NestJS resolves it from the DI container automatically.

```typescript
// The controller asks for AuthService by type token
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
```

For interface-based injection (used by the repository pattern), a **Symbol DI token** replaces the class type, because TypeScript interfaces are erased at runtime:

```typescript
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
  ) {}
}
```

The `@Inject(PAYMENT_REPOSITORY)` decorator tells NestJS which token to resolve. The module declaration maps that token to a concrete class:

```typescript
{ provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }
```

Swap `StaticPaymentRepository` for `DrizzlePaymentRepository` to change the data source without touching the service.

---

## 4. Global Providers in AppModule

Three providers are registered globally in `AppModule` using special tokens from `@nestjs/core`. They run on **every request** across every module automatically — you do not need to declare them in individual modules.

```typescript
// apps/api-gateway/src/app.module.ts
providers: [
  { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  { provide: APP_FILTER,       useClass: AllExceptionsFilter },
  { provide: APP_GUARD,        useClass: JwtAuthGuard },
],
```

| Token | Class | What it does |
|---|---|---|
| `APP_INTERCEPTOR` | `TransformInterceptor` | Wraps every successful response: `{ success: true, data: T, message: "OK" }` |
| `APP_FILTER` | `AllExceptionsFilter` | Catches any thrown exception and formats: `{ success: false, data: null, message, code, statusCode }` |
| `APP_GUARD` | `JwtAuthGuard` | Validates the `Authorization: Bearer <token>` header; rejects with 401 if missing or invalid |

### Opting Out of the Guard

Routes decorated with `@Public()` are skipped by `JwtAuthGuard`:

```typescript
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

`@Public()` sets the `isPublic` metadata key on the handler. The guard reads it via `Reflector` and returns `true` without checking the token.

---

## 5. The Repository Pattern — Why It Exists

Services in this codebase **never import Drizzle** directly. Instead they depend on an interface:

```typescript
export interface IPaymentRepository {
  findAll(): Promise<PaymentRow[]>;
  findById(id: string): Promise<PaymentRow | null>;
  create(data: NewPaymentRow): Promise<PaymentRow>;
  update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null>;
}
```

Two concrete implementations satisfy this interface:

| Class | When to use | Data source |
|---|---|---|
| `StaticPaymentRepository` | Local development, CI, early feature work | In-memory hardcoded array |
| `DrizzlePaymentRepository` | Staging, production | PostgreSQL via Drizzle ORM |

The module decides which implementation to bind at startup:

```typescript
// Development (default):
{ provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }

// Production (one-line swap):
{ provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository }
```

Benefits:
- The service and its unit tests are completely isolated from the database
- You can build and test a full feature before the schema is finalized
- Switching databases (e.g., Postgres → MySQL) requires changing only the repository implementation, not the service

---

## 6. Swagger Integration

Swagger documentation is auto-generated from decorators at startup and served at `http://localhost:3001/api/docs` (development only).

The `DocumentBuilder` in `main.ts` enables Bearer auth globally via `.addBearerAuth()`. Controllers and methods add their own context:

```typescript
@ApiTags('payments')           // Groups routes under "payments" in the sidebar
@ApiBearerAuth()               // Shows the lock icon on all methods in this class
@Controller('payments')
export class PaymentsController { ... }
```

DTOs contribute property-level documentation through `@ApiProperty()`. NestJS reflects on the class structure to build the OpenAPI schema.

---

## 7. Request Pipeline — Full ASCII Diagram

Every HTTP request travels through the following pipeline before reaching your controller method, and the response travels back through the same layers in reverse:

```
Incoming HTTP Request
        │
        ▼
┌───────────────────┐
│   JwtAuthGuard    │  Reads Authorization header, validates token.
│   (APP_GUARD)     │  If @Public() → skips. If invalid → throws 401.
└─────────┬─────────┘
          │  token valid (or @Public route)
          ▼
┌───────────────────┐
│  ValidationPipe   │  Transforms raw JSON into DTO class instance.
│  (global)         │  Strips unknown fields (whitelist: true).
│                   │  Throws 400 if any validator fails.
└─────────┬─────────┘
          │  validated DTO
          ▼
┌───────────────────┐
│   Controller      │  @Get / @Post / @Param / @Body / @Query
│   Method          │  Delegates to service. No business logic here.
└─────────┬─────────┘
          │  calls
          ▼
┌───────────────────┐
│    Service        │  Business logic. Throws HttpException on errors.
│    Method         │  Calls repository.
└─────────┬─────────┘
          │  calls
          ▼
┌───────────────────┐
│   Repository      │  Implements IXxxRepository interface.
│   (Static or      │  StaticXxx = in-memory. DrizzleXxx = real DB.
│    Drizzle)       │
└─────────┬─────────┘
          │  data rows
          ▼  (travels back up through service → controller → interceptor)
┌───────────────────┐
│TransformInterceptor│  Wraps return value:
│  (APP_INTERCEPTOR) │  { success: true, data: <return value>, message: "OK" }
└─────────┬──────────┘
          │
          ▼
   HTTP Response (200 / 201 / etc.)
   { "success": true, "data": {...}, "message": "OK" }

─────────── Error Path ────────────────────────────────────────────

If any layer throws an HttpException (or any other error):
          │
          ▼
┌───────────────────┐
│AllExceptionsFilter│  Catches everything. Formats:
│  (APP_FILTER)     │  { success: false, data: null, message, code, statusCode }
└─────────┬─────────┘
          │
          ▼
   HTTP Response (4xx / 5xx)
   { "success": false, "data": null, "message": "Not found", "code": "NOTFOUND", "statusCode": 404 }
```

### What Each Layer Owns

| Layer | Owns | Does NOT own |
|---|---|---|
| Guard | Auth enforcement | Business decisions |
| ValidationPipe | Input shape validation | Business validation |
| Controller | Route mapping, Swagger docs, param extraction | Business logic |
| Service | Business logic, error throwing | HTTP concerns, DB calls |
| Repository | Data access | Business logic |
| TransformInterceptor | Response envelope | Response content |
| AllExceptionsFilter | Error envelope | Error cause resolution |

---

## 8. Global Prefix

All routes are prefixed with `/api` via `app.setGlobalPrefix('api')` in `main.ts`. A controller declared as `@Controller('payments')` handles requests at `/api/payments`, not `/payments`.

---

## 9. Summary Checklist Before Creating a New Module

Before writing any code, confirm you understand:

- [ ] What entity does this module own? (payments, orders, invoices…)
- [ ] What routes does it expose? (GET list, GET one, POST, PATCH, DELETE?)
- [ ] What fields does the request DTO need?
- [ ] What fields does the response DTO expose?
- [ ] Does any route need to be `@Public()`?
- [ ] Do you need real DB access now, or can `StaticXxxRepository` serve development?

If all five are answered, proceed to [02 — Create Controller and Service](./02-create-controller-and-service.md).
