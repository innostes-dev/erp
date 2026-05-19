import { Seeder, DbType } from './seeder.interface';
import { tenants } from '../schema';

export const systemTenantSeeder: Seeder = {
  name: '01 - System Tenant',
  run: async (db: DbType) => {
    console.log(`Seeding: System Tenant...`);
    await db.insert(tenants).values({
      id: 'system-tenant',
      name: 'System Administration',
      slug: 'system',
      branding: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).onConflictDoNothing();
  }
};
