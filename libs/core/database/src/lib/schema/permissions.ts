import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { auditColumns, idColumn, tenantColumn } from './utils';

export const permissions = pgTable(
  'permissions',
  {
    ...idColumn,
    ...tenantColumn,
    moduleId: text('module_id').notNull(),
    action: text('action').notNull(),
    description: text('description'),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index('permissions_tenant_idx').on(table.tenantId),
    moduleActionIdx: index('permissions_module_action_idx').on(table.moduleId, table.action),
  })
);
