import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './lib/schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/innostes_os';

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, {
  schema,
});

type TenantTable = {
  tenantId: unknown;
};

type TenantQueryOptions = {
  where?: unknown;
};

export const withTenant = <TTable extends TenantTable>(
  table: TTable,
  tenantId: string,
  options: TenantQueryOptions = {}
) => {
  const tenantScope = eq(table.tenantId as never, tenantId);
  if (!options.where) {
    return { ...options, where: tenantScope };
  }

  return { ...options, where: and(tenantScope, options.where as never) };
};

export * from './lib/schema';
