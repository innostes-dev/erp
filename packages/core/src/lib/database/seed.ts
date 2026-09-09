import { createDatabaseService } from './database.factory';
import { roles } from './schemas';

async function main() {
  console.log('Running database seed script...');
  const dbService = createDatabaseService();
  const db = dbService.getDb();

  try {
    

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
