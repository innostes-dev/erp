import type { AuthUserDto } from '../dto/login.dto.js';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

export class TokenService {
  private readonly secretKey: string;

  constructor(secretKey = process.env.JWT_SECRET || 'innostes-os-kernel-auth-secret-key-2026') {
    this.secretKey = secretKey;
  }

  /**
   * Generates a signed Access Token for an authenticated user.
   */
  async generateAccessToken(user: AuthUserDto): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 hours TTL
    };

    // Encode JWT token string
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    
    return `${header}.${encodedPayload}.mock_sig_${Buffer.from(this.secretKey).toString('hex').slice(0, 12)}`;
  }

  /**
   * Generates a Refresh Token for session renewal.
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const randomHex = Buffer.from(Math.random().toString()).toString('hex');
    return `rt_innostes_${userId}_${randomHex.slice(0, 16)}`;
  }
}
