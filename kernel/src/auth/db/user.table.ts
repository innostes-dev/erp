import { pgTable, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  email: text('email').notNull(),
  emailHash: varchar('email_hash', { length: 64 }).notNull().unique(),
  phoneNumber: text('phone_number'),
  phoneNumberHash: varchar('phone_number_hash', { length: 64 }),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 64 }).notNull().default('USER'),
  tenantId: varchar('tenant_id', { length: 64 }),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockoutUntil: timestamp('lockout_until'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserTableSelect = typeof users.$inferSelect;
export type UserTableInsert = typeof users.$inferInsert;
