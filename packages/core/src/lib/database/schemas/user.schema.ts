import { pgTable, varchar, timestamp, uuid, integer, text, boolean} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  first_name: varchar('first_name', { length: 20 }).notNull(),
  last_name: varchar('last_name', { length: 20 }).notNull(),
  middle_name: varchar('middle_name', { length: 20 }),
  gender: integer('gender').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  email_hashed: text('email_hashed'),
  phone: varchar('phone', { length: 10 }).notNull().unique(),
  phone_hashed: text('phone_hashed'),
  status: integer('status').notNull(),
  role_id: uuid('role_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deleted_status: boolean('deleted_status').default(false)
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
