import { pgTable, text, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns, idColumn, tenantColumn } from './utils';
import { tenants } from './tenants';
import { users } from './users';

export const roles = pgTable(
  'roles',
  {
    ...idColumn,
    ...tenantColumn,
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    permissions: jsonb('permissions').$type<string[]>().default([]).notNull(), // Array of permission keys or IDs
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index('roles_tenant_idx').on(table.tenantId),
  })
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
}));
