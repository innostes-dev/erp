import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { AppConfig } from '../config/env';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  token_version: number;
  is_super_admin: boolean;
}

export class TokenService {
  constructor(private readonly cfg: AppConfig['jwt']) {}

  private now(): number {
    return Math.floor(Date.now() / 1000);
  }

  createAccessToken(claims: AccessTokenClaims): string {
    const iat = this.now();
    return jwt.sign({ ...claims, type: 'access', iat, exp: iat + this.cfg.accessMinutes * 60 }, this.cfg.secret, {
      algorithm: this.cfg.algorithm,
    });
  }

  createPasswordResetToken(userId: string, tokenVersion: number): string {
    const iat = this.now();
    return jwt.sign(
      { sub: userId, type: 'password_reset', token_version: tokenVersion, iat, exp: iat + this.cfg.resetMinutes * 60 },
      this.cfg.secret,
      { algorithm: this.cfg.algorithm },
    );
  }

  /** Verify signature and expiry (throws jsonwebtoken errors). */
  decode(token: string): jwt.JwtPayload {
    const payload = jwt.verify(token, this.cfg.secret, { algorithms: [this.cfg.algorithm] });
    if (typeof payload === 'string') throw new jwt.JsonWebTokenError('invalid payload');
    return payload;
  }
}

/** Opaque refresh token: `secrets.token_urlsafe(48)` equivalent (64 url-safe chars). */
export const generateRefreshToken = (): string => randomBytes(48).toString('base64url');

export const API_KEY_PREFIX = 'inno_live_';
export const generateApiKey = (): string => `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
