import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { idColumn, tenantColumn } from './utils';

export const authEvents = pgTable(
  'auth_events',
  {
    ...idColumn,
    userId: text('user_id'), // nullable for pre-auth failures
    ...tenantColumn, // keep tenantColumn as it adds tenantId
    eventType: text('event_type').notNull(), // REGISTER | LOGIN_SUCCESS | LOGIN_FAILURE | etc
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('auth_events_user_id_idx').on(table.userId),
    tenantIdIdx: index('auth_events_tenant_id_idx').on(table.tenantId),
  })
);
