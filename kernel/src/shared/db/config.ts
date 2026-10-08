import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotEnv } from 'dotenv';

export function resolveProjectRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);
  let fallbackRoot = currentDir;

  while (true) {
    const envFile = path.join(currentDir, '.env');
    if (existsSync(envFile)) {
      return currentDir;
    }

    const packageJson = path.join(currentDir, 'package.json');
    if (existsSync(packageJson)) {
      fallbackRoot = currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return fallbackRoot;
    }

    currentDir = parentDir;
  }
}

export function loadDatabaseEnvironment(startDir = process.cwd()) {
  const projectRoot = resolveProjectRoot(startDir);
  const envPath = path.join(projectRoot, '.env');

  if (existsSync(envPath)) {
    loadDotEnv({ path: envPath });
  }

  return { envPath: existsSync(envPath) ? envPath : undefined, projectRoot };
}

export function resolveDatabaseConnectionString(connectionString?: string) {
  if (connectionString) {
    return connectionString;
  }

  loadDatabaseEnvironment();

  const directUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DB_URL ||
    process.env.POSTGRESQL_URL;

  if (directUrl) {
    return directUrl;
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

  if (PGHOST && PGDATABASE) {
    const user = encodeURIComponent(PGUSER ?? 'postgres');
    const password = PGPASSWORD ? `:${encodeURIComponent(PGPASSWORD)}` : '';
    const port = PGPORT ?? '5432';
    return `postgresql://${user}${password}@${PGHOST}:${port}/${PGDATABASE}`;
  }

  throw new Error(
    'Missing database connection settings. Set DATABASE_URL (or PGHOST/PGDATABASE) in the environment or .env file.'
  );
}

export function shouldAutoMigrate(): boolean {
  loadDatabaseEnvironment();
  const val = process.env.AUTO_MIGRATE;
  if (val === undefined || val === '') return true;
  return val.toLowerCase() === 'true' || val === '1';
}

export function shouldAutoSeed(): boolean {
  loadDatabaseEnvironment();
  const val = process.env.AUTO_SEED;
  if (val === undefined || val === '') return true;
  return val.toLowerCase() === 'true' || val === '1';
}
