import type { User } from '@mono/kernel/auth';

let _id = 0;
const id = () => `test-${++_id}`;

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: id(),
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    permissions: ['read:all'],
    ...overrides,
  };
}
