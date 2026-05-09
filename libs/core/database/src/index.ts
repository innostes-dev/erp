import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './lib/schema';

// Export for NestJS
export * from './lib/database.module';
export * from './lib/database.service';
export * from './lib/schema';

// Legacy compatibility exports (Static DB instance)
// WARNING: This uses the environment variable directly. In NestJS, preferred way is DatabaseService.
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/innostes_os';
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

type TenantTable = {
  tenantId: any;
};

type TenantQueryOptions = {
  where?: any;
};

export const withTenant = <TTable extends TenantTable>(
  table: TTable,
  tenantId: string,
  options: TenantQueryOptions = {}
) => {
  const tenantScope = eq(table.tenantId, tenantId);
  if (!options.where) {
    return { ...options, where: tenantScope };
  }

  return { ...options, where: and(tenantScope, options.where) };
};
