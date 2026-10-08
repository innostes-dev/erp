import { createDatabaseClient, shouldAutoSeed } from '../../shared/index.js';
import { seedKernel } from './index.js';

async function main() {
  if (!shouldAutoSeed()) {
    console.log('[Innostes:Seed] AUTO_SEED is disabled. Skipping database seed.');
    return;
  }

  let db;
  try {
    const client = createDatabaseClient();
    db = client.db;
  } catch {
    console.warn('[Innostes:Seed] No database connection found, seeding in-memory.');
  }

  await seedKernel(db);
}

main().catch((err) => {
  console.error('[Innostes:Seed] Seeding failed:', err);
  process.exit(1);
});
