/**
 * libs/core/database/src/lib/schema/auth.schema.ts
 * Session-based authentication schema.
 */
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { auditColumns, idColumn, tenantColumn } from './utils';
import { users } from './users';

export const sessions = pgTable(
  'sessions',
  {
    ...idColumn, // sessionId (sid)
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    ...tenantColumn,
    tokenHash: text('token_hash').notNull().unique(),
    family: text('family').notNull(),
    deviceName: text('device_name'),
    deviceType: text('device_type'), // 'web', 'mobile', or 'desktop'
    ipAddress: text('ip_address'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    ...auditColumns,
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tenantIdIdx: index('sessions_tenant_id_idx').on(table.tenantId),
    tokenHashIdx: index('sessions_token_hash_idx').on(table.tokenHash),
    familyIdx: index('sessions_family_idx').on(table.family),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
