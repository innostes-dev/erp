import { eq } from 'drizzle-orm';
import type { InnostesDatabase } from '../../shared/index.js';
import { users, type UserTableSelect, type UserTableInsert } from '../db/user.table.js';

export class UserRepository {
  private memoryUsers: Map<string, UserTableSelect> = new Map();

  constructor(private readonly db?: InnostesDatabase<any>) {}

  async findByEmailHash(emailHash: string): Promise<UserTableSelect | null> {
    if (this.db) {
      const [found] = await this.db.select().from(users).where(eq(users.emailHash, emailHash));
      return found || null;
    }

    for (const u of this.memoryUsers.values()) {
      if (u.emailHash === emailHash) return u;
    }
    return null;
  }

  async findById(id: string): Promise<UserTableSelect | null> {
    if (this.db) {
      const [found] = await this.db.select().from(users).where(eq(users.id, id));
      return found || null;
    }

    return this.memoryUsers.get(id) || null;
  }

  async create(data: UserTableInsert): Promise<UserTableSelect> {
    if (this.db) {
      const [inserted] = await this.db.insert(users).values(data).returning();
      return inserted!;
    }

    const newUser: UserTableSelect = {
      id: data.id || `usr_${Date.now()}`,
      name: data.name || null,
      email: data.email,
      emailHash: data.emailHash,
      phoneNumber: data.phoneNumber || null,
      phoneNumberHash: data.phoneNumberHash || null,
      passwordHash: data.passwordHash || null,
      role: data.role || 'USER',
      tenantId: data.tenantId || null,
      failedLoginAttempts: data.failedLoginAttempts ?? 0,
      lockoutUntil: data.lockoutUntil || null,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryUsers.set(newUser.id, newUser);
    return newUser;
  }
}
