/**
 * apps/api-gateway/src/auth/auth.service.ts
 * Authentication business logic.
 */
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { eq, and, gt, lt, isNull } from 'drizzle-orm';
import { db, users, sessions, roles, branches, tenants } from '@innostes/core/database';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createId } from '@paralleldrive/cuid2';
import { SessionInfo } from '@innostes/shared';

const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$aGVsbG93b3JsZA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    // Session cleanup cron every 6 hours
    setInterval(async () => {
      try {
        await db
          .delete(sessions)
          .where(lt(sessions.expiresAt, new Date().toISOString()));
        this.logger.log('Expired sessions purged');
      } catch (err) {
        this.logger.error('Failed to purge expired sessions', err);
      }
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Registers a new user.
   */
  async register(dto: RegisterDto, device: any, ip: string | null) {
    // 1. Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.tenantId, dto.tenantId)))
      .limit(1);

    if (existingUser.length > 0) {
      // Silent 201 for email enumeration mitigation
      return {
        message: 'If this email is new, you will receive confirmation',
      };
    }

    // 2. Ensure tenant exists
    let tenantResult = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, dto.tenantId))
        .limit(1);

    if (tenantResult.length === 0) {
        await db.insert(tenants).values({
            id: dto.tenantId,
            name: dto.tenantId,
            slug: dto.tenantId,
            branding: {},
        });
    }

    // 3. Ensure branch exists
    let branchResult = await db
      .select()
      .from(branches)
      .where(and(eq(branches.id, dto.branchId), eq(branches.tenantId, dto.tenantId)))
      .limit(1);

    if (branchResult.length === 0) {
      if (dto.branchId === 'main') {
          await db.insert(branches).values({
              id: 'main',
              tenantId: dto.tenantId,
              name: 'Main Branch',
              branchCode: 'MAIN',
          });
      } else {
          throw new NotFoundException({ code: 'BRANCH_NOT_FOUND' });
      }
    }

    // 4. Hash password
    const passwordHash = await argon2.hash(dto.password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
      type: argon2.argon2id,
    });

    // 5. Get default role
    let roleResult = await db
      .select()
      .from(roles)
      .where(and(eq(roles.isSystem, true), eq(roles.tenantId, dto.tenantId)))
      .limit(1);

    let roleId: string;

    if (roleResult.length === 0) {
        // Create a default Admin role if none exists
        roleId = createId();
        await db.insert(roles).values({
            id: roleId,
            tenantId: dto.tenantId,
            name: 'Admin',
            isSystem: true,
            permissions: [],
        });
    } else {
        roleId = roleResult[0].id;
    }

    // 6. Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        id: createId(),
        email: dto.email,
        password: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tenantId: dto.tenantId,
        roleId: roleId,
      })
      .returning();

    // 7. Create session
    const session = await this.createSession(
      newUser.id,
      dto.tenantId,
      device.deviceName,
      device.deviceType,
      ip
    );

    const tokens = await this.generateTokens(newUser.id, session.sessionId, session.rawRefreshToken);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      ...tokens,
    };
  }

  /**
   * Authenticates a user.
   */
  async login(dto: LoginDto, tenantId: string, device: any, ip: string | null) {
    const userResult = await db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.tenantId, tenantId)))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      await argon2.verify(DUMMY_HASH, dto.password).catch(() => {});
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const validPassword = await argon2.verify(user.password, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (!user.roleId) {
      throw new ForbiddenException({ code: 'NO_ACTIVE_ROLE' });
    }

    // Check for existing active session for this device/IP
    const existingSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, user.id),
          eq(sessions.deviceName, device.deviceName ?? ''),
          eq(sessions.ipAddress, ip ?? ''),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    let sessionId: string;
    let rawRefreshToken: string;

    if (existingSession.length > 0) {
      // Rotate token in-place
      sessionId = existingSession[0].id;
      const { raw, hash } = this.generateRawToken();
      rawRefreshToken = raw;

      await db
        .update(sessions)
        .set({
          tokenHash: hash,
          lastUsedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId));
    } else {
      const newSession = await this.createSession(
        user.id,
        tenantId,
        device.deviceName,
        device.deviceType,
        ip
      );
      sessionId = newSession.sessionId;
      rawRefreshToken = newSession.rawRefreshToken;
    }

    const tokens = await this.generateTokens(user.id, sessionId, rawRefreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  /**
   * Refreshes access token using refresh token.
   */
  async refresh(rawToken: string) {
    const hash = createHash('sha256').update(rawToken).digest('hex');

    const sessionResult = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, hash))
      .limit(1);

    const session = sessionResult[0];

    if (!session) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID' });
    }

    if (session.revokedAt) {
      // Theft detection: revoke entire family
      await db
        .update(sessions)
        .set({ revokedAt: new Date().toISOString() })
        .where(eq(sessions.family, session.family));
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REUSE_DETECTED' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_EXPIRED' });
    }

    // Valid path: rotate
    const { raw, hash: newHash } = this.generateRawToken();

    await db
      .update(sessions)
      .set({
        tokenHash: newHash,
        lastUsedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, session.id));

    const tokens = await this.generateTokens(session.userId, session.id, raw);

    return tokens;
  }

  async logout(sessionId: string) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId));
  }

  async logoutAll(userId: string) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  async getSessions(userId: string, tenantId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const result = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.tenantId, tenantId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .orderBy(sessions.lastUsedAt);

    return result.map((s) => ({
      sessionId: s.id,
      deviceName: s.deviceName,
      deviceType: s.deviceType as any,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(sessionId: string, userId: string, tenantId: string) {
    const sessionResult = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, userId),
          eq(sessions.tenantId, tenantId)
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      throw new NotFoundException({ code: 'SESSION_NOT_FOUND' });
    }

    await db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId));
  }

  async getMe(userId: string, tenantId: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        middleName: users.middleName,
        gender: users.gender,
        avatarUrl: users.avatarUrl,
        tenantId: users.tenantId,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!result.length) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    const row = result[0];

    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      middleName: row.middleName,
      gender: row.gender,
      avatarUrl: row.avatarUrl,
      tenant: {
        tenantId: row.tenantId,
        role: row.roleName ?? null,
        permissions: (row.permissions ?? []) as string[],
      },
    };
  }

  // --- Helpers ---

  private generateRawToken() {
    const raw = randomBytes(64).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
  }

  private async createSession(
    userId: string,
    tenantId: string,
    deviceName: string | null,
    deviceType: string | null,
    ip: string | null
  ) {
    const sessionId = createId();
    const family = createId();
    const { raw, hash } = this.generateRawToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      tenantId,
      tokenHash: hash,
      family,
      deviceName,
      deviceType,
      ipAddress: ip,
      expiresAt: expiresAt.toISOString(),
    });

    return { sessionId, rawRefreshToken: raw };
  }

  private async generateTokens(userId: string, sessionId: string, rawRefreshToken?: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      sid: sessionId,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
