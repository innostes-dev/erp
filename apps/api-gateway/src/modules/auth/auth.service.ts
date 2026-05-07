import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { User } from '@mono/shared/types';
import { IUserRepository, USER_REPOSITORY } from './repositories/user.repository.interface';

export interface SessionPayload {
  user: User;
  token: string;
}

@Injectable()
export class AuthService {
  // In-memory session store: token → User.
  // Swap for a Redis-backed SessionRepository when horizontal scaling is needed.
  private readonly sessions = new Map<string, User>();

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async login(email: string, password: string): Promise<SessionPayload> {
    const record = await this.userRepo.findByEmail(email);
    if (!record) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    const user: User = {
      id: record.id,
      email: record.email,
      name: record.name,
      roles: record.roles as string[],
      permissions: record.permissions as string[],
    };

    const token = this.issueToken(user.id);
    this.sessions.set(token, user);

    return { user, token };
  }

  validateToken(token: string): User | null {
    return this.sessions.get(token) ?? null;
  }

  async refresh(token: string): Promise<SessionPayload> {
    const user = this.sessions.get(token);
    if (!user) throw new UnauthorizedException('Session not found');

    // Rotate — old token is invalidated, new one issued
    this.sessions.delete(token);
    const newToken = this.issueToken(user.id);
    this.sessions.set(newToken, user);

    return { user, token: newToken };
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }

  private issueToken(userId: string): string {
    const rand = Math.random().toString(36).slice(2, 11);
    return `sess_${userId}_${Date.now()}_${rand}`;
  }
}
