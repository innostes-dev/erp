import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';

export type DbType = PostgresJsDatabase<typeof schema>;

export interface Seeder {
  name: string;
  run: (db: DbType) => Promise<void>;
}
