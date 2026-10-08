import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type InnostesDatabase<TSchema extends Record<string, unknown> = Record<string, unknown>> = NodePgDatabase<TSchema>;

export interface DatabaseConnectionOptions {
  connectionString?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized?: boolean };
}

export interface DatabaseEnvironment {
  envPath?: string;
  projectRoot: string;
}

export interface MigrationOptions extends DatabaseConnectionOptions {
  migrationsFolder?: string;
  logger?: {
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

