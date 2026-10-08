import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 64 }).notNull().default('USER'),
  tenantId: varchar('tenant_id', { length: 64 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserTableSelect = typeof users.$inferSelect;
export type UserTableInsert = typeof users.$inferInsert;
