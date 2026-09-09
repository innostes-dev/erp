import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';

export const userSecurity = pgTable('user_security', {
  user_id: uuid('user_id'),
  failure_count: integer('failure_count'),
  locked_time: timestamp('locked_time').notNull(),
});
