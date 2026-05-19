import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  console.log('⏳ Running migrations (Postgres.js driver)...');

  // For Neon or some local setups, SSL might be required or need to be disabled.
  // We try without SSL first, but allow user to configure it.
  const sql = postgres(databaseUrl, { 
    max: 1,
    // ssl: 'require', // Uncomment if using Neon or remote DB
  });
  
  const db = drizzle(sql);

  try {
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, '../libs/core/database/src/lib/migrations') 
    });
    console.log('✅ Migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    
    if (err.message.includes('authentication failed')) {
      console.log('\n💡 Tip: Check your DATABASE_URL in .env. Ensure the password is correct.');
    }
    
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
