/**
 * libs/core/auth/src/lib/auth.service.ts
 */
import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService, users, roles, sessions, branches } from '@innostes/core/database';
import { eq, and, gt, lt, isNull, sql as drizzleSql, desc } from 'drizzle-orm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { createId } from '@paralleldrive/cuid2';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload, SessionInfo } from '@innostes/shared';

const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$aGVsbG93b3JsZA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private dbService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async onModuleInit(): Promise<void> {
    // Session cleanup cron every 6 hours
    setInterval(async () => {
      try {
        await this.dbService.db
          .delete(sessions)
          .where(lt(sessions.expiresAt, new Date().toISOString()));
        this.logger.log('Expired sessions purged');
      } catch (err) {
        this.logger.error('Failed to purge expired sessions', err);
      }
    }, 6 * 60 * 60 * 1000);
  }

  async register(dto: RegisterDto, device: { deviceName: string | null; deviceType: string | null }, ip: string | null) {
    const existingUser = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.tenantId, dto.tenantId)))
      .limit(1);

    if (existingUser.length) {
      return { message: 'If this email is new, you will receive confirmation' };
    }

    const branch = await this.dbService.db
      .select()
      .from(branches)
      .where(and(eq(branches.id, dto.branchId), eq(branches.tenantId, dto.tenantId)))
      .limit(1);

    if (!branch.length) {
      throw new NotFoundException({ code: 'BRANCH_NOT_FOUND' });
    }

    const hashedPassword = await argon2.hash(dto.password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
      type: argon2.argon2id,
    });

    const systemRole = await this.dbService.db
      .select()
      .from(roles)
      .where(and(eq(roles.isSystem, true), eq(roles.tenantId, dto.tenantId)))
      .limit(1);

    if (!systemRole.length) {
      throw new ForbiddenException({ code: 'NO_SYSTEM_ROLE_FOUND' });
    }

    const [user] = await this.dbService.db
      .insert(users)
      .values({
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tenantId: dto.tenantId,
        roleId: systemRole[0].id,
      })
      .returning();

    const sessionId = createId();
    const family = createId();
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.dbService.db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash,
      family,
      deviceName: device.deviceName,
      deviceType: device.deviceType as any,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const accessToken = this.jwtService.sign({ sub: user.id, sid: sessionId });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(dto: LoginDto, tenantId: string, device: { deviceName: string | null; deviceType: string | null }, ip: string | null) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      await argon2.verify(DUMMY_HASH, dto.password).catch(() => {});
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const passwordMatch = await argon2.verify(user.password, dto.password);
    if (!passwordMatch) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (!user.roleId) {
      throw new ForbiddenException({ code: 'NO_ACTIVE_ROLE' });
    }

    const [existingSession] = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, user.id),
          device.deviceName ? eq(sessions.deviceName, device.deviceName) : isNull(sessions.deviceName),
          ip ? eq(sessions.ipAddress, ip) : isNull(sessions.ipAddress),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    let sessionId: string;
    let family: string;
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    if (existingSession) {
      sessionId = existingSession.id;
      family = existingSession.family;
      await this.dbService.db
        .update(sessions)
        .set({
          tokenHash,
          lastUsedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sessionId));
    } else {
      sessionId = createId();
      family = createId();
      await this.dbService.db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash,
        family,
        deviceName: device.deviceName,
        deviceType: device.deviceType as any,
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const accessToken = this.jwtService.sign({ sub: user.id, sid: sessionId });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refresh(rawToken: string) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const [session] = await this.dbService.db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, hash))
      .limit(1);

    if (!session) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID' });
    }

    if (session.revokedAt) {
      await this.dbService.db
        .update(sessions)
        .set({ revokedAt: new Date().toISOString() })
        .where(eq(sessions.family, session.family));
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REUSE_DETECTED' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_EXPIRED' });
    }

    const newRawToken = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRawToken).digest('hex');

    await this.dbService.db
      .update(sessions)
      .set({
        tokenHash: newHash,
        lastUsedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, session.id));

    const accessToken = this.jwtService.sign({ sub: session.userId, sid: session.id });

    return { accessToken, refreshToken: newRawToken };
  }

  async logout(sessionId: string) {
    await this.dbService.db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId));
  }

  async logoutAll(userId: string) {
    await this.dbService.db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  async getSessions(userId: string, tenantId: string, callerSessionId: string): Promise<SessionInfo[]> {
    const results = await this.dbService.db
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
      .orderBy(desc(sessions.lastUsedAt));

    return results.map((row: any) => ({
      sessionId: row.id,
      deviceName: row.deviceName,
      deviceType: row.deviceType,
      ipAddress: row.ipAddress,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      isCurrent: row.id === callerSessionId,
    }));
  }

  async revokeSession(targetId: string, userId: string, tenantId: string) {
    const [session] = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, targetId),
          eq(sessions.userId, userId),
          eq(sessions.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!session) {
      throw new NotFoundException({ code: 'SESSION_NOT_FOUND' });
    }

    await this.dbService.db
      .update(sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(sessions.id, targetId));
  }

  async getMe(userId: string, tenantId: string) {
    const result = await this.dbService.db
      .select({
        id:          users.id,
        email:       users.email,
        firstName:   users.firstName,
        lastName:    users.lastName,
        middleName:  users.middleName,
        gender:      users.gender,
        avatarUrl:   users.avatarUrl,
        tenantId:    users.tenantId,
        roleName:    roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!result.length) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    const row = result[0];

    return {
      id:         row.id,
      email:      row.email,
      firstName:  row.firstName,
      lastName:   row.lastName,
      middleName: row.middleName,
      gender:     row.gender,
      avatarUrl:  row.avatarUrl,
      tenant: {
        tenantId:    row.tenantId,
        role:        row.roleName ?? null,
        permissions: (row.permissions ?? []) as string[],
      },
    };
  }
}
