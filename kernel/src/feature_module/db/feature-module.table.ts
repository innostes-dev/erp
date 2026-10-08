import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const sysModules = pgTable('sys_modules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type SysModuleTableSelect = typeof sysModules.$inferSelect;
export type SysModuleTableInsert = typeof sysModules.$inferInsert;

export const sysOrgModules = pgTable('sys_org_modules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orgId: varchar('org_id', { length: 64 }).notNull(),
  moduleId: varchar('module_id', { length: 64 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type SysOrgModuleTableSelect = typeof sysOrgModules.$inferSelect;
export type SysOrgModuleTableInsert = typeof sysOrgModules.$inferInsert;
