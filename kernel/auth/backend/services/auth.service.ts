import type { LoginDto, LoginResponseDto } from '../dto/login.dto.js';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenService } from './token.service.js';
import { PasswordService } from './password.service.js';
import { InvalidCredentialsException, UserInactiveException } from '../errors/auth.errors.js';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * Authenticates user credentials strictly against database records and scrypt password hashes.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UserInactiveException('User account is currently disabled');
    }

    const isValidPassword = await this.passwordService.verifyPassword(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new InvalidCredentialsException('Invalid email or password');
    }

    const token = await this.tokenService.generateAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
      },
    };
  }
}
