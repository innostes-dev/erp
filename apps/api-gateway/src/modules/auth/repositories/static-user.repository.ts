import { Injectable } from '@nestjs/common';
import type { IUserRepository } from './user.repository.interface';
import type { UserRow, NewUserRow } from '../../../database/schema/users.schema';

const STATIC_USERS: UserRow[] = [
  {
    id: 'usr_01',
    email: 'admin@mono.dev',
    passwordHash: '$2a$10$D3Cds5uwK6lbvCRGHvrqp.l2gvdbiAZSD460H2ANGD1EAbDNDiOka', // admin123
    name: 'Admin User',
    roles: ['admin', 'user'],
    permissions: ['read', 'write', 'admin'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'usr_02',
    email: 'user@mono.dev',
    passwordHash: '$2a$10$/W2cvYvJRA79C58wSrEwauJlA6wM2uOALN3JEAE5oTjcb3XkLLBtK', // user123
    name: 'Regular User',
    roles: ['user'],
    permissions: ['read'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

@Injectable()
export class StaticUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    return STATIC_USERS.find(u => u.email === email) ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    return STATIC_USERS.find(u => u.id === id) ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_data: NewUserRow): Promise<UserRow> {
    throw new Error('StaticUserRepository is read-only');
  }
}
