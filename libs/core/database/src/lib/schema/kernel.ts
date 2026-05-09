import { boolean, jsonb, pgTable, text } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  branding: jsonb('branding').$type<Record<string, unknown>>().notNull().default({}),
});

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  branchCode: text('branch_code').notNull(),
});

export const moduleRegistry = pgTable('module_registry', {
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId: text('module_id').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(false),
});
