import { pgTable, serial, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    permissions: text('permissions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});