/**
 * Run once to populate initial users:
 *   DATABASE_URL=<url> npx ts-node -r tsconfig-paths/register src/database/seed.ts
 */
import 'reflect-metadata';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import { users } from './schema';

const SEED_USERS = [
  {
    id: 'usr_001',
    email: 'admin@mono.dev',
    password: 'admin123',
    name: 'Admin User',
    roles: ['admin', 'user'],
    permissions: ['read:all', 'write:all', 'admin:all'],
  },
  {
    id: 'usr_002',
    email: 'user@mono.dev',
    password: 'user123',
    name: 'Jane Smith',
    roles: ['user'],
    permissions: ['read:all'],
  },
];

async function seed() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  const client = postgres(url);
  const db = drizzle(client);

  console.log('Seeding users…');

  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const { password: _, ...rest } = u;

    await db
      .insert(users)
      .values({ ...rest, passwordHash })
      .onConflictDoNothing();

    console.log(`  ✓ ${u.email}`);
  }

  console.log('Done.');
  await client.end();
}

void seed();
