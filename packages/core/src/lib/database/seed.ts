import { createDatabaseService } from './database.factory';
import { roles, users } from './schemas';

async function main() {
  console.log('Running database seed script...');
  const dbService = createDatabaseService();
  const db = dbService.getDb();

  try {
    // Insert some mock users
    await db.insert(users).values([
      { name: 'Alice Smith', email: 'alice@example.com' },
      { name: 'Bob Jones', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
    ]);

    await db.insert(roles).values([
      {
        name: 'Admin',
        description: 'Full system access',
        permissions: JSON.stringify(['users.create', 'users.read', 'users.update', 'users.delete']),
      },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dbService.close();
  }
}

main();
