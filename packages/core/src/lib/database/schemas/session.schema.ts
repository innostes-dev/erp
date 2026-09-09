import { pgTable, uuid, varchar, text, timestamp, inet } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  device_id: uuid('device_id'),
  access_token: uuid('access_token').notNull(),
  refresh_token: uuid('refresh_token').notNull(),
  session_token_hash: text('session_token_hash').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull(),
  last_activity_at: timestamp('last_activity_at').notNull(),
  revoked_at: timestamp('revoked_at'),
  revocation_reason: varchar('revocation_reason', { length: 100 }),
  ip_address: inet('ip_address'),
  user_agent: text('user_agent'),
});
