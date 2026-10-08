import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orgId: varchar('org_id', { length: 64 }),
  name: varchar('name', { length: 255 }).notNull(),
  isKernelRole: boolean('is_kernel_role').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type RoleTableSelect = typeof roles.$inferSelect;
export type RoleTableInsert = typeof roles.$inferInsert;
