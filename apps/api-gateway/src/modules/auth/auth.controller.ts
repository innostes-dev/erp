import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '@mono/shared/types';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { SessionPayload } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, SessionDto, UserDto } from './dto/session.dto';

interface BearerRequest {
  headers: { authorization?: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in', description: 'Authenticate with email and password. Returns a bearer token valid for the current session.' })
  @ApiOkResponse({ type: SessionDto, description: 'Authentication successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto): Promise<SessionPayload> {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user', description: 'Returns the authenticated user resolved from the bearer token.' })
  @ApiOkResponse({ type: UserDto, description: 'Authenticated user profile' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh token', description: 'Rotates the bearer token — the old token is immediately invalidated and a new one is returned.' })
  @ApiOkResponse({ type: SessionDto, description: 'New token issued' })
  @ApiUnauthorizedResponse({ description: 'Session not found or token expired' })
  async refresh(@Req() req: BearerRequest): Promise<SessionPayload> {
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    return this.authService.refresh(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out', description: 'Invalidates the current bearer token. The session is removed from the server.' })
  @ApiOkResponse({ type: LogoutDto, description: 'Session terminated' })
  logout(@Req() req: BearerRequest): { ok: true } {
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    this.authService.logout(token);
    return { ok: true };
  }
}
