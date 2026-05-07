# 04 — Repository Pattern

The repository pattern is the mechanism that keeps services free of database-specific code. Every service in this codebase injects an interface, not a concrete class. The module decides at startup which concrete implementation backs that interface. Switching databases — or switching from in-memory stubs to a real database — requires changing one line in the module file.

---

## 1. Why the Repository Pattern

Without this pattern, a service looks like this:

```typescript
// Anti-pattern: service imports Drizzle directly
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.provider';
import { payments } from '../../database/schema';

@Injectable()
export class PaymentsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async findAll() {
    return this.db.select().from(payments);  // DB-specific
  }
}
```

Problems:
- Unit testing requires a live database or complex mocking of Drizzle internals
- Swapping the ORM (e.g., to Prisma or TypeORM) means editing every service file
- Business logic is tangled with data-access concern

With the repository pattern:

```typescript
// Correct: service depends on an interface
@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
  ) {}

  async findAll() {
    return this.repo.findAll();  // no DB knowledge here
  }
}
```

The service never imports `drizzle-orm`. You can unit-test the service with a hand-rolled stub that implements `IPaymentRepository`. You can swap the backing store by changing one line in `payments.module.ts`.

---

## 2. Create the DI Token and Interface

Create `apps/api-gateway/src/modules/payments/repositories/payment.repository.interface.ts`:

```typescript
import type { PaymentRow, NewPaymentRow } from '../../../database/schema/payments.schema';

/**
 * Contract that every payment store implementation must satisfy.
 * PaymentsService depends only on this interface — never on Drizzle directly.
 */
export interface IPaymentRepository {
  /** Return all payment records ordered by createdAt descending. */
  findAll(): Promise<PaymentRow[]>;

  /** Return a single payment by primary key, or null if not found. */
  findById(id: string): Promise<PaymentRow | null>;

  /** Insert a new payment record and return the created row. */
  create(data: NewPaymentRow): Promise<PaymentRow>;

  /**
   * Apply a partial update to the given payment.
   * Returns the updated row, or null if the ID does not exist.
   */
  update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null>;
}

/**
 * DI injection token.
 * Must be a Symbol — TypeScript interfaces are erased at runtime
 * and cannot be used as tokens directly.
 */
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
```

### Why Symbol, not string?

Using a string token (e.g., `'PAYMENT_REPOSITORY'`) risks collision if another library uses the same string. `Symbol('PAYMENT_REPOSITORY')` is guaranteed unique across the entire runtime, even if two modules use the same label string.

---

## 3. Create the Static (In-Memory) Repository

Create `apps/api-gateway/src/modules/payments/repositories/static-payment.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import type { IPaymentRepository } from './payment.repository.interface';
import type { PaymentRow, NewPaymentRow } from '../../../database/schema/payments.schema';

/**
 * Development-only implementation of IPaymentRepository.
 * Data is hard-coded in memory — no database required.
 * Swap for DrizzlePaymentRepository in production.
 */

const STATIC_PAYMENTS: PaymentRow[] = [
  {
    id: 'pay_01',
    userId: 'usr_01',
    amount: 49.99,
    currency: 'USD',
    status: 'completed',
    description: 'Monthly subscription fee',
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
  },
  {
    id: 'pay_02',
    userId: 'usr_02',
    amount: 9.99,
    currency: 'USD',
    status: 'pending',
    description: null,
    createdAt: new Date('2026-02-01T08:30:00Z'),
    updatedAt: new Date('2026-02-01T08:30:00Z'),
  },
  {
    id: 'pay_03',
    userId: 'usr_01',
    amount: 149.00,
    currency: 'EUR',
    status: 'refunded',
    description: 'Annual plan upgrade',
    createdAt: new Date('2026-03-10T14:00:00Z'),
    updatedAt: new Date('2026-03-12T09:00:00Z'),
  },
];

@Injectable()
export class StaticPaymentRepository implements IPaymentRepository {
  // Clone the array so mutations during tests do not bleed between test cases
  private readonly store: PaymentRow[] = STATIC_PAYMENTS.map((p) => ({ ...p }));

  async findAll(): Promise<PaymentRow[]> {
    return [...this.store].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findById(id: string): Promise<PaymentRow | null> {
    return this.store.find((p) => p.id === id) ?? null;
  }

  async create(data: NewPaymentRow): Promise<PaymentRow> {
    const now = new Date();
    const row: PaymentRow = {
      ...data,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(row);
    return row;
  }

  async update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null> {
    const index = this.store.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.store[index]!;
    const updated: PaymentRow = {
      ...existing,
      ...data,
      id,                         // never allow overwriting the PK
      updatedAt: new Date(),
    };
    this.store[index] = updated;
    return updated;
  }
}
```

### Design notes for StaticPaymentRepository

- `STATIC_PAYMENTS` is the canonical seed data — add rows here to populate the dev environment
- The `store` field is a copy of the seed array so tests can safely mutate it without affecting other tests running in the same process
- All methods are `async` to match the interface contract exactly, even though no I/O is actually performed
- `create` accepts `NewPaymentRow` (the insert type) and `update` accepts `Partial<NewPaymentRow>` so the method signatures mirror the Drizzle implementation

---

## 4. Create the Drizzle (Real DB) Repository

Create `apps/api-gateway/src/modules/payments/repositories/drizzle-payment.repository.ts`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDB } from '../../../database/database.provider';
import { payments, type PaymentRow, type NewPaymentRow } from '../../../database/schema';
import type { IPaymentRepository } from './payment.repository.interface';

/**
 * Production implementation of IPaymentRepository.
 * Uses Drizzle ORM to query PostgreSQL via the DRIZZLE_DB token.
 * Activate by swapping useClass in payments.module.ts.
 */
@Injectable()
export class DrizzlePaymentRepository implements IPaymentRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async findAll(): Promise<PaymentRow[]> {
    return this.db
      .select()
      .from(payments)
      .orderBy(payments.createdAt);
  }

  async findById(id: string): Promise<PaymentRow | null> {
    const rows = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: NewPaymentRow): Promise<PaymentRow> {
    const rows = await this.db
      .insert(payments)
      .values(data)
      .returning();
    return rows[0]!;
  }

  async update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null> {
    const rows = await this.db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
```

`DrizzlePaymentRepository` injects `DRIZZLE_DB` — the same Drizzle instance used by `DrizzleUserRepository`. This means the module must import `DatabaseModule` to access the `DRIZZLE_DB` provider. See [07 — Wire Into App](./07-wire-into-app.md) for the full module setup.

---

## 5. Wire the Repository into the Module

In `payments.module.ts`, the module tells NestJS's DI container which class to instantiate when something asks for `PAYMENT_REPOSITORY`:

```typescript
// Development (default):
{ provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }

// Production (swap this one line):
{ provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository }
```

The full module is shown in [07 — Wire Into App](./07-wire-into-app.md).

---

## 6. How to Swap to the Real Database

1. Open `apps/api-gateway/src/modules/payments/payments.module.ts`
2. Change one provider line:

```typescript
// Before:
{ provide: PAYMENT_REPOSITORY, useClass: StaticPaymentRepository }

// After:
{ provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository }
```

3. Ensure `DatabaseModule` is in the `imports` array (required for `DRIZZLE_DB`)
4. Ensure `DATABASE_URL` is set in your environment
5. Restart the server — no other files need to change

---

## 7. Adding a New Method to the Interface

This is the most common extension task. Suppose you need to find all payments for a specific user.

### Step 1 — Add the method to the interface

```typescript
// payment.repository.interface.ts
export interface IPaymentRepository {
  findAll(): Promise<PaymentRow[]>;
  findById(id: string): Promise<PaymentRow | null>;
  findByUserId(userId: string): Promise<PaymentRow[]>;   // ← new
  create(data: NewPaymentRow): Promise<PaymentRow>;
  update(id: string, data: Partial<NewPaymentRow>): Promise<PaymentRow | null>;
}
```

TypeScript will immediately show compile errors on both `StaticPaymentRepository` and `DrizzlePaymentRepository` because they no longer satisfy the interface. This is intentional — it guides you to implement the method in both places.

### Step 2 — Implement in StaticPaymentRepository

```typescript
async findByUserId(userId: string): Promise<PaymentRow[]> {
  return this.store
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
```

### Step 3 — Implement in DrizzlePaymentRepository

```typescript
async findByUserId(userId: string): Promise<PaymentRow[]> {
  return this.db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(payments.createdAt);
}
```

### Step 4 — Call from the service

```typescript
async findByUser(userId: string): Promise<PaymentListDto> {
  const rows = await this.repo.findByUserId(userId);
  return { items: rows.map(this.toDto), total: rows.length };
}
```

The TypeScript compiler enforces that all implementations stay in sync. If you add to the interface but forget to implement in one repository, the project will not compile.

---

## 8. Relationship to DatabaseModule

`DrizzlePaymentRepository` injects `DRIZZLE_DB`. That token is provided by `DatabaseModule`. To use it:

```typescript
// payments.module.ts
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],   // ← makes DRIZZLE_DB available
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_REPOSITORY, useClass: DrizzlePaymentRepository },
  ],
})
export class PaymentsModule {}
```

When using `StaticPaymentRepository` you do not need `DatabaseModule` in the imports array — no DB connection is made.

---

## 9. Unit Testing the Service

Because the service depends only on `IPaymentRepository`, you can create a minimal mock in tests without Drizzle, without PostgreSQL, and without NestJS's testing module if you want to keep tests fast:

```typescript
// payments.service.spec.ts
import { Test } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PAYMENT_REPOSITORY, IPaymentRepository } from './repositories/payment.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockRepo: IPaymentRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  create: jest.fn(),
  update: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PAYMENT_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('throws NotFoundException when payment does not exist', async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.findById('pay_99')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when refunding a non-completed payment', async () => {
    (mockRepo.findById as jest.Mock).mockResolvedValueOnce({
      id: 'pay_01',
      status: 'pending',
      amount: 49.99,
    });
    await expect(service.refund('pay_01', {})).rejects.toThrow(BadRequestException);
  });
});
```

No database, no environment variables, no Docker — the test runs in milliseconds.

---

## 10. Summary

| File | Purpose |
|---|---|
| `payment.repository.interface.ts` | Defines the contract + `PAYMENT_REPOSITORY` symbol |
| `static-payment.repository.ts` | In-memory implementation for dev/CI |
| `drizzle-payment.repository.ts` | PostgreSQL implementation for staging/prod |
| `payments.module.ts` | Binds one concrete class to `PAYMENT_REPOSITORY` |
| `payments.service.ts` | Injects `PAYMENT_REPOSITORY` — never touches Drizzle |

The only file you change to switch databases is `payments.module.ts`.
