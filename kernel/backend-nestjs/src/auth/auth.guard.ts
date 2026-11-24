import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AccountSuspendedError, InvalidTokenError } from '../common/errors';
import { isUuid } from '../common/validation';
import { TokenService } from '../crypto/tokens';
import { UserRow, isBlocked } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { ApiKeyRow, ApiKeysService } from './api-keys.service';

export interface AuthContext {
  user: UserRow;
  apiKey?: ApiKeyRow;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, ...rest] = header.split(' ');
    const token = rest.join(' ').trim();
    if (scheme.toLowerCase() === 'bearer' && token) return token;
  }
  const cookie = (req.cookies as Record<string, string> | undefined)?.access_token;
  return cookie || undefined;
}

/** Authenticates a JWT access token (Bearer header or `access_token` cookie) or an `inno_live_` API key. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly users: UsersService,
    private readonly apiKeys: ApiKeysService,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const raw = extractToken(req);
    if (!raw) throw new InvalidTokenError('Authentication token or API key required.');

    if (raw.startsWith('inno_live_')) {
      const key = await this.apiKeys.verify(raw);
      if (!key) throw new InvalidTokenError('Invalid, expired, or revoked API key.');
      const user = await this.users.getById(key.user_id);
      if (!user || user.status !== 'active' || isBlocked(user)) throw new AccountSuspendedError();
      req.auth = { user, apiKey: key };
      return true;
    }

    let payload: jwt.JwtPayload;
    try {
      payload = this.tokens.decode(raw);
    } catch (e) {
      throw new InvalidTokenError(
        e instanceof jwt.TokenExpiredError ? 'Access token has expired.' : 'Invalid access token.',
      );
    }
    if (payload.type !== 'access') throw new InvalidTokenError('Invalid token type: expected access token.');
    if (!payload.sub) throw new InvalidTokenError('Token subject is missing.');
    if (!isUuid(String(payload.sub))) throw new InvalidTokenError('Invalid token subject format.');

    const user = await this.users.getById(String(payload.sub).toLowerCase());
    if (!user || user.status !== 'active' || isBlocked(user)) throw new AccountSuspendedError();
    // A missing/non-numeric claim must not bypass revocation: token_version is mandatory.
    if (typeof payload.token_version !== 'number' || user.token_version !== payload.token_version) {
      throw new InvalidTokenError('Token version invalidated. Please log in again.');
    }
    req.auth = { user };
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserRow => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.auth) throw new InvalidTokenError('Authentication token or API key required.');
  return req.auth.user;
});

export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.auth) throw new InvalidTokenError('Authentication token or API key required.');
  return req.auth;
});
