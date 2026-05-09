import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns, idColumn, tenantColumn } from './utils';
import { tenants } from './tenants';

export const branches = pgTable(
  'branches',
  {
    ...idColumn,
    ...tenantColumn,
    name: text('name').notNull(),
    branchCode: text('branch_code').notNull(),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index('branches_tenant_idx').on(table.tenantId),
  })
);

export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
}));
