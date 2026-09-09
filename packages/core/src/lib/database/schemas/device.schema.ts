import { pgTable, uuid, varchar, text, timestamp, boolean, inet } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  device_name: varchar('device_name', { length: 150 }),
  device_fingerprint_hash: text('device_fingerprint_hash'),
  platform: varchar('platform', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  ip_address: inet('ip_address'),
  first_seen_at: timestamp('first_seen_at').notNull(),
  last_seen_at: timestamp('last_seen_at').notNull(),
  trusted: boolean('trusted').notNull().default(false),
  revoked_at: timestamp('revoked_at'),
});
