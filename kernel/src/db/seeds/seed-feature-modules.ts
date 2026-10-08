import { FeatureModuleRepository } from '../../feature_module/repositories/feature-module.repository.js';
import type { InnostesDatabase } from '../../shared/index.js';

export async function seedFeatureModules(db?: InnostesDatabase<any>) {
  const repo = new FeatureModuleRepository(db);
  const defaultModules = [
    { id: 'mod_organization', name: 'Organization & Multi-Tenancy', description: 'Tenant organizations, sub-entities, and environment settings.' },
    { id: 'mod_role', name: 'Role & RBAC Engine', description: 'Role-based access control, permissions, and policy enforcement.' },
    { id: 'mod_crm', name: 'Customer Relationship Management', description: 'Customer leads, contacts, deals, and interaction history.' },
    { id: 'mod_sales', name: 'Sales Orders & Invoicing', description: 'Quotations, sales orders, customer invoices, and payments.' },
    { id: 'mod_inventory', name: 'Inventory & Warehousing', description: 'Product catalog, stock levels, warehouse transfers, and SKUs.' },
    { id: 'mod_purchasing', name: 'Purchasing & Vendors', description: 'Vendor management, purchase requisitions, and purchase orders.' },
    { id: 'mod_accounting', name: 'General Ledger & Accounting', description: 'Chart of accounts, journal entries, tax calculations, and financial reports.' },
    { id: 'mod_hr', name: 'Human Resources & Payroll', description: 'Employee records, attendance, leave management, and payroll runs.' },
  ];

  for (const mod of defaultModules) {
    const existing = await repo.findModuleById(mod.id);
    if (!existing) {
      await repo.createModule(mod);
      console.log(`[Innostes:Seed] Registered system feature module: ${mod.name} (${mod.id})`);
    }
  }
}
