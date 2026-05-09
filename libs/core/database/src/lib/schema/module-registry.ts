import { pgTable, text, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns, tenantColumn } from './utils';
import { tenants } from './tenants';

export const moduleRegistry = pgTable(
  'module_registry',
  {
    ...tenantColumn,
    moduleId: text('module_id').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(false),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index('module_registry_tenant_idx').on(table.tenantId),
  })
);

export const moduleRegistryRelations = relations(moduleRegistry, ({ one }) => ({
  tenant: one(tenants, {
    fields: [moduleRegistry.tenantId],
    references: [tenants.id],
  }),
}));
