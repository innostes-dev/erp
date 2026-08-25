import { pgTable, varchar, timestamp, text,uuid,boolean } from 'drizzle-orm/pg-core';

export const tenant = pgTable('tenant', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    slug : text('slug').notNull().unique(),
    address: text('address'),
    logo_url: text('logo_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    is_deleted: boolean('is_deleted').default(false).notNull(),
});