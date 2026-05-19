/**
 * libs/core/auth/src/guards/auth.guard.ts
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService, sessions } from '@innostes/core/database';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { JwtPayload } from '@innostes/shared';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private dbService: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['__Host-at'];

    if (!token) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        algorithms: ['HS256'],
        clockTolerance: 10,
      });
    } catch (err) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    // Session DB check
    const activeSession = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, payload.sid),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    if (!activeSession.length) {
      throw new UnauthorizedException({ code: 'SESSION_REVOKED' });
    }

    request.user = {
      userId: payload.sub,
      sessionId: payload.sid,
    };

    return true;
  }
}
