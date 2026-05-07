# 05 — Database Schema with Drizzle ORM

This guide covers creating, exporting, migrating, and seeding a Drizzle schema for the Payments module. The same steps apply to any new module that needs persistent storage.

The schema file is the **single source of truth** for both the database table structure and the TypeScript types used throughout the module.

---

## 1. Background — How Drizzle Works in This Project

Drizzle ORM uses a code-first approach. You define tables as TypeScript objects in schema files. Drizzle then:

1. Compares your schema to the current database state
2. Generates SQL migration files (`npm run db:generate`)
3. Applies those migrations to the database (`npm run db:migrate`)

The `DRIZZLE_DB` token in `database.provider.ts` holds the connected Drizzle instance. Every `DrizzleXxxRepository` injects this token to run queries.

---

## 2. Create the Payments Schema File

Create `apps/api-gateway/src/database/schema/payments.schema.ts`:

```typescript
import { numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * `payments` table — stores all payment records.
 *
 * Column naming convention: snake_case in the DB, camelCase in TypeScript.
 * Drizzle handles the mapping automatically via the column alias (second argument).
 */
export const payments = pgTable('payments', {
  // Primary key — application-generated ID (format: pay_<nanoid>)
  id: varchar('id', { length: 36 }).primaryKey(),

  // Foreign key to users.id — not enforced at DB level here for flexibility,
  // add a references() call if you want FK constraint enforcement.
  userId: varchar('user_id', { length: 36 }).notNull(),

  // Monetary amount stored as numeric to avoid floating-point precision issues.
  // Precision 12 allows up to 999,999,999.99; scale 2 allows two decimal places.
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),

  // ISO 4217 currency code, e.g. "USD", "EUR", "GBP"
  currency: varchar('currency', { length: 3 }).notNull(),

  // Lifecycle status of the payment
  status: varchar('status', { length: 20 }).notNull().default('pending'),

  // Optional human-readable note
  description: text('description'),

  // Audit timestamps — defaultNow() sets DB-side default; .notNull() guarantees value
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * TypeScript types inferred directly from the schema.
 *
 * PaymentRow  — shape returned by SELECT queries
 * NewPaymentRow — shape accepted by INSERT queries (optional columns excluded)
 */
export type PaymentRow    = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
```

### Column builder reference

| Builder | PostgreSQL type | Notes |
|---|---|---|
| `varchar(name, { length })` | `VARCHAR(n)` | Fixed max length; use for IDs, codes, short strings |
| `text(name)` | `TEXT` | Unlimited length; use for descriptions, notes |
| `numeric(name, { precision, scale })` | `NUMERIC(p, s)` | Exact decimal; always use for money |
| `integer(name)` | `INTEGER` | 32-bit integer |
| `boolean(name)` | `BOOLEAN` | True/false |
| `timestamp(name)` | `TIMESTAMP` | Date + time without timezone |
| `timestamp(name, { withTimezone: true })` | `TIMESTAMPTZ` | Date + time with timezone |
| `jsonb(name)` | `JSONB` | Binary JSON; supports GIN indexes |
| `text(name).array()` | `TEXT[]` | PostgreSQL text array (used in `users.roles`) |

### Column modifiers

| Modifier | Effect |
|---|---|
| `.primaryKey()` | Marks the column as the primary key |
| `.notNull()` | Adds `NOT NULL` constraint |
| `.unique()` | Adds a unique index |
| `.default(value)` | Sets a static default (TypeScript-side) |
| `.defaultNow()` | Sets `DEFAULT NOW()` at the database level |
| `.references(() => otherTable.column)` | Adds a foreign key constraint |

---

## 3. Export from the Schema Index

Every schema file must be re-exported from the barrel file. This is what `DrizzlePaymentRepository` imports, and it is also what Drizzle's migration tool uses to discover all tables.

Edit `apps/api-gateway/src/database/schema/index.ts`:

```typescript
// Before:
export { users, type UserRow, type NewUserRow } from './users.schema';

// After:
export { users, type UserRow, type NewUserRow } from './users.schema';
export { payments, type PaymentRow, type NewPaymentRow } from './payments.schema';
```

**This step is mandatory.** If you forget it:
- `db:generate` will not detect your new table
- `DrizzlePaymentRepository` imports from `'../../../database/schema'` — the import will resolve to `undefined` at runtime
- TypeScript will still compile (because of how barrel re-exports work) so there will be no compile error, only a silent runtime failure

---

## 4. Verify TypeScript Compiles

Before running migrations, confirm the schema file is syntactically valid:

```bash
pnpm --filter @mono/api-gateway tsc --noEmit
```

Fix any type errors before proceeding. Drizzle's `$inferSelect` / `$inferInsert` utilities are type-checked — if a column definition is malformed, TypeScript will catch it here.

---

## 5. Generate the Migration

```bash
npm run db:generate
# or
pnpm --filter @mono/api-gateway db:generate
```

What this command does:

1. Drizzle reads all table definitions exported from `schema/index.ts`
2. Drizzle connects to the database (using `DATABASE_URL`) and reads the current schema
3. It computes the diff between your TypeScript schema and the DB state
4. It writes SQL migration files to `apps/api-gateway/drizzle/` (or whichever `out` directory is configured in `drizzle.config.ts`)

Example of a generated migration file (`0002_add_payments_table.sql`):

```sql
CREATE TABLE IF NOT EXISTS "payments" (
  "id"          VARCHAR(36)       PRIMARY KEY NOT NULL,
  "user_id"     VARCHAR(36)       NOT NULL,
  "amount"      NUMERIC(12, 2)    NOT NULL,
  "currency"    VARCHAR(3)        NOT NULL,
  "status"      VARCHAR(20)       NOT NULL DEFAULT 'pending',
  "description" TEXT,
  "created_at"  TIMESTAMP         NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP         NOT NULL DEFAULT NOW()
);
```

**Never hand-edit generated migration files.** If you need to change the migration, modify the schema and regenerate.

---

## 6. Apply the Migration

```bash
npm run db:migrate
# or
pnpm --filter @mono/api-gateway db:migrate
```

What this command does:

1. Drizzle reads the migration files in `drizzle/` in filename order
2. It checks the `__drizzle_migrations` table (created automatically on first run) to see which migrations have already been applied
3. It executes all unapplied migrations in order inside a transaction
4. It records each applied migration in `__drizzle_migrations`

If a migration fails, Drizzle rolls back the entire transaction, leaving the database unchanged.

---

## 7. Add to the Seed Script

The seed script populates the database with development data. Edit `apps/api-gateway/src/database/seed.ts`:

```typescript
// Existing seed function — add payments after existing seed calls
import { payments } from './schema';

async function seed(db: DrizzleDB): Promise<void> {
  // ... existing user seeding ...

  // Seed payments
  await db.insert(payments).values([
    {
      id: 'pay_01',
      userId: 'usr_01',
      amount: '49.99',           // numeric columns accept string in Drizzle
      currency: 'USD',
      status: 'completed',
      description: 'Monthly subscription fee',
    },
    {
      id: 'pay_02',
      userId: 'usr_02',
      amount: '9.99',
      currency: 'USD',
      status: 'pending',
      description: null,
    },
  ]).onConflictDoNothing();      // idempotent — safe to run multiple times
}
```

Run the seed:

```bash
npm run db:seed
# or
pnpm --filter @mono/api-gateway db:seed
```

---

## 8. Type Inference — How it Works

`typeof payments.$inferSelect` resolves to the exact TypeScript type for a row returned by a `SELECT *` query. `typeof payments.$inferInsert` resolves to the type for an `INSERT` statement — required columns are non-optional, columns with defaults are optional.

```typescript
// Drizzle infers these automatically — you never write them manually:
type PaymentRow = {
  id: string;
  userId: string;
  amount: string;          // Note: numeric columns return as string in postgres-js
  currency: string;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NewPaymentRow = {
  id: string;
  userId: string;
  amount: string | number;
  currency: string;
  status?: string;          // optional because it has a default
  description?: string | null;
  createdAt?: Date;         // optional because of defaultNow()
  updatedAt?: Date;
};
```

Note that `numeric` columns come back as `string` from the `postgres-js` driver (the underlying driver used here). If you need to do arithmetic, parse with `parseFloat()` or `Number()` in the service or repository layer.

---

## 9. Adding a Column to an Existing Table

Suppose you need to add a `processorId` column to payments later:

1. Edit `apps/api-gateway/src/database/schema/payments.schema.ts`:

```typescript
export const payments = pgTable('payments', {
  // ... existing columns ...
  processorId: varchar('processor_id', { length: 100 }),  // nullable — no .notNull()
});
```

2. Run `npm run db:generate` — Drizzle generates an `ALTER TABLE` migration:

```sql
ALTER TABLE "payments" ADD COLUMN "processor_id" VARCHAR(100);
```

3. Run `npm run db:migrate`

4. Update `StaticPaymentRepository`'s seed data to include the new field where relevant

5. Update `PaymentDto` to expose the new field with `@ApiProperty()`

6. Update the service's `toDto()` mapper to include the new field

---

## 10. Common Mistakes

### Forgetting to export from `schema/index.ts`

```typescript
// WRONG — schema file exists but is not exported from the barrel
// apps/api-gateway/src/database/schema/payments.schema.ts  ← created
// apps/api-gateway/src/database/schema/index.ts  ← NOT updated

// Result: db:generate does not see the table, DrizzlePaymentRepository gets undefined
```

Fix: always add the export to `index.ts` immediately after creating the schema file.

### Using `integer` for monetary amounts

```typescript
// WRONG — floating-point errors
amount: integer('amount')

// Also wrong — precision loss in JavaScript
amount: real('amount')

// CORRECT — exact decimal arithmetic
amount: numeric('amount', { precision: 12, scale: 2 })
```

### Missing `.notNull()` on required columns

If a column is logically required but does not have `.notNull()`, the database will accept `NULL` values and your TypeScript type will include `| null`. Add `.notNull()` to all columns that must always have a value.

### Column name mismatch between schema and DB

Drizzle allows you to use a different TypeScript property name from the database column name:

```typescript
// TypeScript name: userId
// DB column name:  user_id
userId: varchar('user_id', { length: 36 }).notNull()
```

If you accidentally swap the names (TypeScript camelCase as the DB column name), Drizzle will create a column named `userId` in PostgreSQL, which will break queries that expect `user_id`. Always use snake_case as the first argument to column builders.

### Editing migration files manually

Drizzle tracks migrations by file hash. If you edit a generated SQL file, its hash changes and Drizzle may try to re-apply it, causing errors. Never edit migration files. Instead, modify the schema and regenerate.

---

## 11. Full Schema File Reference

```
apps/api-gateway/src/database/schema/
├── index.ts              ← barrel export — import all tables here
├── users.schema.ts       ← existing users table
└── payments.schema.ts    ← new payments table
```

Each new module that needs DB persistence adds one file here and one export line to `index.ts`.
