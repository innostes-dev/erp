import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface IDatabaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDb(): NodePgDatabase<any>;
  close(): Promise<void>;
  healthCheck(): Promise<boolean>;
  runMigrations(migrationsFolder?: string): Promise<void>;
}
