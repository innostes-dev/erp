import { pgTable,varchar, timestamp, text ,uuid,json} from 'drizzle-orm/pg-core';

export const auditlog = pgTable('audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    user_id: uuid('user_id'),
    action: varchar('action',{length:255}).notNull(),
    before_value: json('before'),
    after_value: json('after'),
    ip_address: varchar('ip_address',{length:255}),
    user_agent: text('useragent'),
    request_id: text('request_id'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});