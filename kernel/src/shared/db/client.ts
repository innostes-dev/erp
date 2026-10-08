import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { resolveDatabaseConnectionString } from './config.js';
import type { DatabaseConnectionOptions, InnostesDatabase } from './types.js';

const { Pool } = pg;

export function createDatabaseClient<TSchema extends Record<string, unknown> = Record<string, unknown>>(
  options: DatabaseConnectionOptions = {},
  schema?: TSchema
) {
  const connectionString = resolveDatabaseConnectionString(options.connectionString);
  const pool = new Pool({
    connectionString,
    max: options.max ?? 20,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 2000,
    ssl: options.ssl,
  });

  const db: InnostesDatabase<TSchema> = drizzle(pool, { schema });

  return { db, pool, connectionString };
}

export async function pingDatabase(pool: pg.Pool): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Innostes:DB] Health check ping failed:', error);
    return false;
  }
}
