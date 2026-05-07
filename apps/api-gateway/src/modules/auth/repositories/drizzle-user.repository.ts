import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDB } from '../../../database/database.provider';
import { users, type UserRow, type NewUserRow } from '../../../database/schema';
import type { IUserRepository } from './user.repository.interface';

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDB) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: NewUserRow): Promise<UserRow> {
    const rows = await this.db.insert(users).values(data).returning();
    return rows[0]!;
  }
}
