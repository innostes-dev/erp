/**
 * apps/api-gateway/src/auth/guards/auth.guard.ts
 * Verifies the access token from cookies.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { JwtPayload } from '@innostes/shared';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies['access_token'];

    if (!token) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING' });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
        clockTolerance: 10,
      });

      // Note: User requested NOT to check DB every time for valid session to save CPU.
      // If we wanted to, we would inject Drizzle here and verify the sid exists in sessions table.

      (request as any)['user'] = {
        userId: payload.sub,
        sessionId: payload.sid,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }
  }
}
