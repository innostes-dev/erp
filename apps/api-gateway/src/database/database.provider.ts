import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const databaseProvider = {
  provide: DRIZZLE_DB,
  useFactory: (): DrizzleDB => {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL environment variable is not set');

    const client = postgres(url, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
    });

    return drizzle(client, { schema });
  },
};
