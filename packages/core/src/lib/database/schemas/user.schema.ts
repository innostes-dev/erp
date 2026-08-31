import { pgTable, uuid, varchar, timestamp, smallint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }).notNull(),
  middle_name: varchar('middle_name', { length: 255 }),
  gender: smallint("gender")
    .notNull()
    .default(0),
  email: varchar('email', { length: 255 }).notNull().unique(),
  email_hash: varchar('email_hash', { length: 255 }).default("hi@gmail.com"),
  phone: varchar('phone', { length: 10 }).notNull().unique(),
  phone_hash: varchar('phone_hash', { length: 255 }).default("hwi@gmail.com"),
  email_verified_at: timestamp('email_verified_at'),
  status: smallint('status').default(1).notNull(),
  role_id: uuid('role_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  deleted_status: smallint('deleted_status').default(0).notNull(),

});

