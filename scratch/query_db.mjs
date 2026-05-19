import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not defined');
    return;
  }
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const tenants = await sql`SELECT COUNT(*) FROM tenants`;
    const users = await sql`SELECT COUNT(*) FROM users`;
    const branches = await sql`SELECT COUNT(*) FROM branches`;
    const moduleRegistry = await sql`SELECT COUNT(*) FROM module_registry`;
    
    console.log('--- DATABASE STATUS ---');
    console.log('Tenants count:', tenants[0].count);
    console.log('Users count:', users[0].count);
    console.log('Branches count:', branches[0].count);
    console.log('Module Registry count:', moduleRegistry[0].count);
    console.log('-----------------------');
    
    if (Number(users[0].count) > 0) {
      const allUsers = await sql`SELECT id, first_name, last_name, role_id, tenant_id FROM users`;
      console.log('Users detail:', allUsers);
    }
  } catch (err) {
    console.error('Database query failed:', err.message);
  } finally {
    await sql.end();
  }
}

main();
