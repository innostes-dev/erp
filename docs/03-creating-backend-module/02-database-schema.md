# 02 - Database Schema (Data Access)

The first step in building a backend module is defining its data shape.

## 1. Generate the Library
Use Nx to scaffold the data-access library:
```bash
npx nx g @nx/js:lib data-access --directory=libs/modules/inventory
```

## 2. Define the Drizzle Schema
We use **Drizzle ORM** for type-safe database interactions. Create a `schema.ts` file.

```typescript
// libs/modules/inventory/data-access/src/schema.ts
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

// Define your tables
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').notNull(), // CRITICAL: Multi-tenant support
  name: text('name').notNull(),
  sku: text('sku').unique().notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### ⚠️ Multi-Tenancy Rule
Every table MUST include a `tenantId` (or `tenant_id`) column if the data belongs to a specific customer workspace. Do not forget this, or cross-tenant data leaks will occur.

## 3. Export the Schema
Ensure your schema is exported in `libs/modules/inventory/data-access/src/index.ts`:
```typescript
export * from './schema';
```
