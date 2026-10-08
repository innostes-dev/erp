import { eq } from 'drizzle-orm';
import type { InnostesDatabase } from '@innostes/core';
import { users, type UserTableSelect } from '../db/schema.js';

export type UserRecord = UserTableSelect;

export class UserRepository {
  constructor(private readonly db: InnostesDatabase) {}

  /**
   * Find user record strictly by email address from the database.
   * Zero hardcoded fallback credentials.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    if (!this.db) {
      throw new Error('[UserRepository] Database connection is missing or uninitialized.');
    }

    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Insert a new user into the database.
   */
  async create(user: typeof users.$inferInsert): Promise<UserRecord> {
    if (!this.db) {
      throw new Error('[UserRepository] Database connection is missing or uninitialized.');
    }

    const [newUser] = await this.db.insert(users).values(user).returning();
    if (!newUser) {
      throw new Error('[UserRepository] Failed to insert new user record into database.');
    }
    return newUser;
  }
}
