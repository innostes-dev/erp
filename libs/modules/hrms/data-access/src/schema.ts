import { pgTable, text } from 'drizzle-orm/pg-core';

export const departments = pgTable('hrms_departments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
});

export const employees = pgTable('hrms_employees', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  departmentId: text('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  fullName: text('full_name').notNull(),
  payrollCode: text('payroll_code').notNull(),
});
