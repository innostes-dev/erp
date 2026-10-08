import type { AuthUserDto } from '../dto/login.dto.js';

export class TokenService {
  async generateToken(user: AuthUserDto): Promise<string> {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    ).toString('base64url');

    const signature = Buffer.from(`signed_mock_${user.id}`).toString('base64url');
    return `${header}.${payload}.${signature}`;
  }
}
