import { RoleRepository } from '../../role/repositories/role.repository.js';
import type { InnostesDatabase } from '../../shared/index.js';

export async function seedRoles(db?: InnostesDatabase<any>) {
  const repo = new RoleRepository(db);
  const defaultRoles = [
    {
      id: 'role_super_admin',
      name: 'Super Administrator',
      isKernelRole: true,
      description: 'Full unconstrained system access across all tenants and kernel domains.',
    },
    {
      id: 'role_admin',
      name: 'Organization Administrator',
      isKernelRole: true,
      description: 'Organization-level administrative access to all installed feature modules.',
    },
    {
      id: 'role_user',
      name: 'Standard User',
      isKernelRole: true,
      description: 'Standard operational user account.',
    },
  ];

  for (const role of defaultRoles) {
    const existing = await repo.findById(role.id);
    if (!existing) {
      await repo.create(role);
      console.log(`[Innostes:Seed] Created kernel role: ${role.name} (${role.id})`);
    }
  }
}
