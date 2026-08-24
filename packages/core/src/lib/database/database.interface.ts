import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface IDatabaseService {
  getDb(): NodePgDatabase<any>;
  close(): Promise<void>;
  healthCheck(): Promise<boolean>;
  runMigrations(migrationsFolder?: string): Promise<void>;
}
