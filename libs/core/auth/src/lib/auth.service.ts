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
import { DatabaseService, users, roles, sessions, branches, authEvents, otpTokens, tenants, moduleRegistry } from '@innostes/core/database';
import { encryptEmail, hashEmail, decryptEmail } from '../utils/crypto.util';
import { eq, and, gt, lt, isNull, sql as drizzleSql, desc } from 'drizzle-orm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { createId } from '@paralleldrive/cuid2';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SetupDto } from '../dto/setup.dto';
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
    const emailHmac = hashEmail(dto.email);
    const existingUser = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.emailHmac, emailHmac), eq(users.tenantId, dto.tenantId)))
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
        emailEnc: encryptEmail(dto.email),
        emailHmac,
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

    await this.dbService.db.insert(authEvents).values({
      userId: user.id,
      tenantId: user.tenantId,
      eventType: 'REGISTER',
      ipAddress: ip,
      userAgent: device.deviceName,
    });

    const accessToken = this.jwtService.sign({ sub: user.id, sid: sessionId });

    return {
      user: {
        id: user.id,
        email: dto.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(dto: LoginDto, tenantId: string, device: { deviceName: string | null; deviceType: string | null }, ip: string | null) {
    const emailHmac = hashEmail(dto.email);
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.emailHmac, emailHmac), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      await argon2.verify(DUMMY_HASH, dto.password).catch(() => {});
      await this.dbService.db.insert(authEvents).values({ tenantId, eventType: 'LOGIN_FAILURE', ipAddress: ip, userAgent: device.deviceName, metadata: { reason: 'user_not_found' } });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await this.dbService.db.insert(authEvents).values({ userId: user.id, tenantId, eventType: 'ACCOUNT_LOCKED', ipAddress: ip, userAgent: device.deviceName });
      throw new UnauthorizedException({ code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked' });
    }

    const passwordMatch = await argon2.verify(user.password, dto.password);
    if (!passwordMatch) {
      const newFailCount = (user.failedLoginCount || 0) + 1;
      let lockedUntil = null;
      if (newFailCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await this.dbService.db.update(users).set({ failedLoginCount: newFailCount, lockedUntil }).where(eq(users.id, user.id));
      await this.dbService.db.insert(authEvents).values({ userId: user.id, tenantId, eventType: 'LOGIN_FAILURE', ipAddress: ip, userAgent: device.deviceName, metadata: { reason: 'invalid_password' } });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.dbService.db.update(users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, user.id));
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

    await this.dbService.db.insert(authEvents).values({
      userId: user.id,
      tenantId,
      eventType: 'LOGIN_SUCCESS',
      ipAddress: ip,
      userAgent: device.deviceName,
    });

    const accessToken = this.jwtService.sign({ sub: user.id, sid: sessionId });

    return {
      user: {
        id: user.id,
        email: dto.email,
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
        emailEnc:    users.emailEnc,
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
      email:      row.emailEnc ? decryptEmail(row.emailEnc) : '',
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

  async forgotPassword(dto: ForgotPasswordDto, ip: string | null) {
    const emailHmac = hashEmail(dto.email);
    const [user] = await this.dbService.db.select().from(users).where(and(eq(users.emailHmac, emailHmac), eq(users.tenantId, dto.tenantId))).limit(1);
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    await this.dbService.db.insert(otpTokens).values({
      userId: user.id,
      otpHash,
      purpose: 'FORGOT_PASSWORD',
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    this.logger.log(`OTP for ${dto.email}: ${otpCode}`);
  }

  async verifyOtp(dto: VerifyOtpDto, ip: string | null) {
    const emailHmac = hashEmail(dto.email);
    const [user] = await this.dbService.db.select().from(users).where(and(eq(users.emailHmac, emailHmac), eq(users.tenantId, dto.tenantId))).limit(1);
    if (!user) throw new UnauthorizedException({ code: 'INVALID_OTP' });

    const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');
    const [otp] = await this.dbService.db.select().from(otpTokens).where(
      and(eq(otpTokens.userId, user.id), eq(otpTokens.purpose, 'FORGOT_PASSWORD'), isNull(otpTokens.usedAt))
    ).orderBy(desc(otpTokens.createdAt)).limit(1);

    if (!otp || new Date(otp.expiresAt) < new Date()) {
      throw new UnauthorizedException({ code: 'INVALID_OTP' });
    }

    if (otp.attempts >= 5) {
      throw new UnauthorizedException({ code: 'OTP_EXPIRED' });
    }

    if (otp.otpHash !== otpHash) {
      await this.dbService.db.update(otpTokens).set({ attempts: otp.attempts + 1 }).where(eq(otpTokens.id, otp.id));
      throw new UnauthorizedException({ code: 'INVALID_OTP' });
    }

    await this.dbService.db.update(otpTokens).set({ usedAt: new Date().toISOString() }).where(eq(otpTokens.id, otp.id));

    const resetToken = this.jwtService.sign({ sub: user.id, purpose: 'RESET_PASSWORD' }, { expiresIn: '15m' });
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto, ip: string | null, device: { deviceName: string | null; deviceType: string | null }) {
    let payload;
    try {
      payload = this.jwtService.verify(dto.resetToken, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_RESET_TOKEN' });
    }

    if (payload.purpose !== 'RESET_PASSWORD') {
      throw new UnauthorizedException({ code: 'INVALID_RESET_TOKEN' });
    }

    const userId = payload.sub;
    const [user] = await this.dbService.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException();

    const hashedPassword = await argon2.hash(dto.newPassword, { memoryCost: 65536, timeCost: 3, parallelism: 1, type: argon2.argon2id });
    
    await this.dbService.db.update(users).set({ 
      password: hashedPassword, 
      passwordChangedAt: new Date().toISOString(),
      lockedUntil: null,
      failedLoginCount: 0
    }).where(eq(users.id, userId));

    await this.logoutAll(userId);

    await this.dbService.db.insert(authEvents).values({
      userId,
      tenantId: user.tenantId,
      eventType: 'PASSWORD_CHANGED',
      ipAddress: ip,
      userAgent: device.deviceName,
    });
  }

  async getSetupStatus() {
    try {
      const adminCount = await this.dbService.db
        .select({ count: drizzleSql<number>`count(*)` })
        .from(users)
        .limit(1);

      const isInitialized = Number(adminCount[0]?.count || 0) > 0;
      return { isInitialized };
    } catch (err: any) {
      // Tables may not exist yet (pre-migration). Treat as uninitialized.
      this.logger.warn(`getSetupStatus DB query failed: ${err.message}. Assuming uninitialized.`);
      console.error('>>> [AuthService] getSetupStatus Error:', err);
      return { isInitialized: false };
    }
  }

  async initializeSetup(dto: SetupDto) {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(process.cwd(), 'setup_debug.log');
    
    const logToFile = (msg: string) => {
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    };

    logToFile(`>>> INIT ATTEMPT: Tenant ${dto.tenantId}`);

    let status: { isInitialized: boolean };
    try {
      status = await this.getSetupStatus();
    } catch (err: any) {
      logToFile(`getSetupStatus error: ${err.message}`);
      status = { isInitialized: false };
    }

    if (status.isInitialized) {
      logToFile('ERROR: System already initialized');
      throw new ForbiddenException({ code: 'SYSTEM_ALREADY_INITIALIZED' });
    }

    try {
      // ── Step 1: Tenant ──────────────────────────────────────────────────────
      logToFile('Step 1: Creating tenant...');
      await this.dbService.db.insert(tenants).values({
        id: dto.tenantId,
        name: dto.tenantName,
        slug: dto.tenantSlug,
        branding: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ── Step 2: Branch ──────────────────────────────────────────────────────
      logToFile('Step 2: Creating branch...');
      const branchId = createId();
      await this.dbService.db.insert(branches).values({
        id: branchId,
        tenantId: dto.tenantId,
        name: dto.branchName || 'Headquarters',
        branchCode: 'MAIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ── Step 3: Super Admin Role ────────────────────────────────────────────
      logToFile('Step 3: Creating Super Admin role...');
      const roleId = createId();
      await this.dbService.db.insert(roles).values({
        id: roleId,
        tenantId: dto.tenantId,
        name: 'Super Admin',
        description: 'Full system access',
        isSystem: true,
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ── Step 4: Super Admin User ────────────────────────────────────────────
      logToFile('Step 4: Hashing password...');
      const hashedPassword = await argon2.hash(dto.adminPassword, {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
        type: argon2.argon2id,
      });

      logToFile('Step 4: Inserting user...');
      const [user] = await this.dbService.db
        .insert(users)
        .values({
          id: createId(),
          tenantId: dto.tenantId,
          emailEnc: encryptEmail(dto.adminEmail),
          emailHmac: hashEmail(dto.adminEmail),
          password: hashedPassword,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          roleId: roleId,
          emailVerifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // ── Step 5: Core Module Registry ────────────────────────────────────────
      logToFile('Step 5: Registering core modules...');
      const coreModules = ['auth', 'database', 'kernel', 'tenant'];
      for (const mod of coreModules) {
        await this.dbService.db.insert(moduleRegistry).values({
          tenantId: dto.tenantId,
          moduleId: mod,
          isEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      logToFile('SUCCESS: System initialized');

      return {
        success: true,
        message: 'System initialized successfully',
        admin: {
          id: user.id,
          email: dto.adminEmail,
        },
      };

    } catch (err: any) {
      logToFile(`FATAL ERROR: ${err.message}`);
      logToFile(`STACK: ${err.stack}`);
      throw err;
    }
  }
}


