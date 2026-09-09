import { pgTable,varchar, timestamp, text ,integer,uuid} from 'drizzle-orm/pg-core';

export const ipReputation = pgTable('ip_reputation', {
    id: uuid('id').defaultRandom().primaryKey(),
    ip_address: varchar('ip_address', { length: 255 }).notNull().unique(),
    risk_score: integer('risk_score').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull(),
    reason: text('reason'),
    first_seen_at: timestamp('first_seen_at').defaultNow().notNull(),
    last_seen_at: timestamp('last_seen_at').defaultNow().notNull(),
    blocked_until: timestamp('blocked_until'),
})