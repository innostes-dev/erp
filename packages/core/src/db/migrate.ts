import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabaseClient } from './client.js';
import { resolveProjectRoot } from './config.js';
import type { MigrationOptions } from './types.js';

/**
 * Discovers all migration folders across kernel/*, modules/*, tools/*, and root drizzle/.
 */
export function discoverModuleMigrationFolders(projectRoot = resolveProjectRoot()): Array<{ id: string; folder: string }> {
  const folders: Array<{ id: string; folder: string }> = [];

  // 1. Root drizzle folder
  const rootDrizzle = path.resolve(projectRoot, 'drizzle');
  if (existsSync(rootDrizzle)) {
    folders.push({ id: 'root', folder: rootDrizzle });
  }

  // 2. Scan kernel, modules, and tools directories
  const scanGroup = (groupDirName: string) => {
    const groupPath = path.resolve(projectRoot, groupDirName);
    if (!existsSync(groupPath)) return;

    const entries = readdirSync(groupPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const moduleId = entry.name;

      const directMigrations = path.join(groupPath, moduleId, 'migrations');
      const backendMigrations = path.join(groupPath, moduleId, 'backend', 'migrations');

      if (existsSync(directMigrations)) {
        folders.push({ id: `${groupDirName}_${moduleId}`, folder: directMigrations });
      } else if (existsSync(backendMigrations)) {
        folders.push({ id: `${groupDirName}_${moduleId}`, folder: backendMigrations });
      }
    }
  };

  scanGroup('kernel');
  scanGroup('modules');
  scanGroup('tools');

  return folders;
}

/**
 * Runs database migrations for all discovered modules/tools in Innostes OS.
 */
export async function runDatabaseMigrations(options: MigrationOptions = {}) {
  const { db, pool } = createDatabaseClient(options);
  const projectRoot = resolveProjectRoot();
  const logger = options.logger ?? console;

  logger.info('[Innostes OS DB] Discovering and running database migrations...');

  try {
    if (options.migrationsFolder) {
      await migrate(db, { migrationsFolder: options.migrationsFolder });
      logger.info(`[Innostes OS DB] Migrations applied for target folder: ${options.migrationsFolder}`);
    } else {
      const migrationTargets = discoverModuleMigrationFolders(projectRoot);

      if (migrationTargets.length === 0) {
        logger.info('[Innostes OS DB] No migration folders found.');
      } else {
        for (const target of migrationTargets) {
          logger.info(`[Innostes OS DB] Running migrations for module "${target.id}"...`);
          const migrationsTable = target.id === 'root' ? '__drizzle_migrations' : `__drizzle_migrations_${target.id}`;
          await migrate(db, {
            migrationsFolder: target.folder,
            migrationsTable,
          });
        }
        logger.info(`[Innostes OS DB] Successfully completed migrations across ${migrationTargets.length} modules/tools.`);
      }
    }

    return { db, pool };
  } catch (error) {
    logger.error('[Innostes OS DB] Migration execution failed.');
    logger.error(String(error));
    throw error;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runDatabaseMigrations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}