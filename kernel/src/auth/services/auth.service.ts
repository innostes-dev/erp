import crypto from 'node:crypto';
import type { UserRepository } from '../repositories/user.repository.js';
import type { TokenService } from './token.service.js';
import type { PasswordService } from './password.service.js';
import type { LoginDto, LoginResponseDto } from '../dto/login.dto.js';
import { InvalidCredentialsException } from '../errors/auth.errors.js';

export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const emailHash = hashEmail(dto.email);
    const user = await this.userRepository.findByEmailHash(emailHash);
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isValidPassword = await this.passwordService.verifyPassword(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new InvalidCredentialsException();
    }

    const userDto = {
      id: user.id,
      name: user.name || 'User',
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };

    const token = await this.tokenService.generateToken(userDto);

    return {
      token,
      user: userDto,
    };
  }
}
