import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns } from './utils';
import { branches } from './branches';
import { users } from './users';
import { roles } from './roles';

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(), // Using text for tenant ID is fine as it's often a slug or human-readable ID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  branding: jsonb('branding').$type<Record<string, unknown>>().notNull().default({}),
  ...auditColumns,
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
}));
