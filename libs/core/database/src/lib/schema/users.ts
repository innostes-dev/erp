import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns, idColumn, tenantColumn } from './utils';
import { tenants } from './tenants';
import { roles } from './roles';

export const users = pgTable(
  'users',
  {
    ...idColumn,
    ...tenantColumn,
    email: text('email').notNull(),
    password: text('password').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    middleName: text('middle_name'),
    gender: text('gender'),
    avatarUrl: text('avatar_url'),
    roleId: text('role_id').references(() => roles.id),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index('users_tenant_idx').on(table.tenantId),
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.roleId),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));
