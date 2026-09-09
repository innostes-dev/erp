import { pgTable,varchar, timestamp, text ,uuid,boolean} from 'drizzle-orm/pg-core';

export const loginAttempts = pgTable('login_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id'),
    ip_reputation_id: uuid('ip_reputation_id'),
    ip_address: varchar('ip_address', { length: 255 }).notNull().unique(),
    success: boolean('success').notNull(),
    failure_reason: varchar('failure_reason', { length: 255 }),
    user_agent: text('user_agent'),
    created_at: timestamp('created_at').defaultNow().notNull(),
})