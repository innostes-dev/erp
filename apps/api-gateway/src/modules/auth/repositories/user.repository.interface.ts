import type { UserRow, NewUserRow } from '../../../database/schema';

// The contract every user-store implementation must satisfy.
// AuthService depends only on this — never on Drizzle directly.
export interface IUserRepository {
  findByEmail(email: string): Promise<UserRow | null>;
  findById(id: string): Promise<UserRow | null>;
  create(data: NewUserRow): Promise<UserRow>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
