import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns, idColumn, tenantColumn } from './utils';
import { tenants } from './tenants';
import { roles } from './roles';

export const users = pgTable(
  'users',
  {
    ...idColumn,
    ...tenantColumn,
    emailEnc: text('email_enc').notNull(),
    emailHmac: text('email_hmac').notNull().unique(),
    password: text('password').notNull(),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true, mode: 'string' }),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'string' }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true, mode: 'string' }),
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
    emailHmacIdx: index('users_email_hmac_idx').on(table.emailHmac),
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
