import 'reflect-metadata';
import { ConfigError, loadConfig } from './config/env';
import { DatabaseService } from './db/database.service';
import { Migrator } from './db/migrator';

/** `npm run migrate`: create the kernel schema unless it already exists (safe to run repeatedly). */
async function main(): Promise<void> {
  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
  const db = new DatabaseService(cfg);
  try {
    const applied = await new Migrator(db).run();
    console.log(applied ? 'Kernel schema created.' : 'Kernel schema already present; nothing to do.');
  } finally {
    await db.onModuleDestroy();
  }
}

main().catch((err: unknown) => {
  console.error('Migration failed', err);
  process.exit(1);
});
