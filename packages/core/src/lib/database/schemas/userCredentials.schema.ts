import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userCredentials = pgTable('user_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  password_changed_at: timestamp('password_changed_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
