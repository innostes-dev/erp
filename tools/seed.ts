import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../libs/core/database/src/lib/schema';
import { seeders } from '../libs/core/database/src/lib/seeds';

async function runSeed() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/innostes_os';
  console.log('Connecting to database...');
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('====================================');
    console.log('🌱 Starting Modular Database Seeding');
    console.log('====================================');

    for (const seeder of seeders) {
      console.log(`\nExecuting: ${seeder.name}`);
      await seeder.run(db as any);
      console.log(`✅ Completed: ${seeder.name}`);
    }

    console.log('\n====================================');
    console.log('✅ All seeders executed successfully!');
    console.log('====================================');

  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await client.end();
  }
}

runSeed();
