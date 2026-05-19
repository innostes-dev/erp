import { systemTenantSeeder } from './01-system-tenant.seed';
import { superAdminSeeder } from './02-super-admin.seed';
import { Seeder } from './seeder.interface';

// Add new seeders to this array in the order they should be executed
export const seeders: Seeder[] = [
  systemTenantSeeder,
  superAdminSeeder,
];
