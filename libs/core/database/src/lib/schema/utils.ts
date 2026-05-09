import { timestamp, text, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * Base audit columns for every table.
 * Ensures UTC timestamps and automatic update tracking.
 */
export const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
};

/**
 * Common ID column using CUID2.
 * Better for URLs and client-side generation.
 */
export const idColumn = {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
};

/**
 * Multi-tenant support column.
 * This should be included in every table that contains tenant-specific data.
 */
export const tenantColumn = {
  tenantId: text('tenant_id').notNull(),
};
