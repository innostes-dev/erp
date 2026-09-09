import { pgTable, uuid, text, timestamp, inet } from 'drizzle-orm/pg-core';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  token_hash: text('token_hash').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull(),
  used_at: timestamp('used_at'),
  request_ip: inet('request_ip'),
  user_agent: text('user_agent'),
});
