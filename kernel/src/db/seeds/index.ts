import type { InnostesDatabase } from '../../shared/index.js';
import { seedRoles } from './seed-roles.js';
import { seedFeatureModules } from './seed-feature-modules.js';

export async function seedKernel(db?: InnostesDatabase<any>) {
  console.log('[Innostes:Seed] Starting kernel database seeding...');
  await seedRoles(db);
  await seedFeatureModules(db);
  console.log('[Innostes:Seed] Kernel database seeding completed successfully.');
}

export * from './seed-roles.js';
export * from './seed-feature-modules.js';
