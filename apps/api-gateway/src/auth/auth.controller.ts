/**
 * apps/api-gateway/src/auth/auth.controller.ts
 * Authentication routes.
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { parseDevice, extractIp } from './utils/device.util';
import { UserContext, TenantContext } from '@innostes/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('register')
  @Throttle({ register: { ttl: 3600, limit: 5 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const device = parseDevice(req.headers['user-agent']);
    const ip = extractIp(req);
    const result = await this.authService.register(dto, device, ip);

    if ('accessToken' in result && result.accessToken) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      return { success: true, data: result.user };
    }

    return { success: true, data: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { ttl: 900, limit: 10 } })
  async login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const device = parseDevice(req.headers['user-agent']);
    const ip = extractIp(req);
    const result = await this.authService.login(dto, tenantId, device, ip);

    this.setCookies(res, result.accessToken, result.refreshToken);
    return { success: true, data: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ refresh: { ttl: 60, limit: 20 } })
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const rawToken = req.cookies['refresh_token'];
    if (!rawToken) return { success: false, error: { code: 'REFRESH_TOKEN_MISSING', message: 'Missing refresh token' } };

    const result = await this.authService.refresh(rawToken);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { success: true };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ logout: { ttl: 60, limit: 5 } })
  async logout(@CurrentUser() user: UserContext, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logout(user.sessionId);
    this.clearCookies(res);
    return { success: true, data: { message: 'Logged out' } };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ logout: { ttl: 60, limit: 3 } })
  async logoutAll(@CurrentUser() user: UserContext, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logoutAll(user.userId);
    this.clearCookies(res);
    return { success: true, data: { message: 'All sessions revoked' } };
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ sessions: { ttl: 60, limit: 30 } })
  async getSessions(@CurrentUser() user: UserContext, @CurrentTenant() tenant: TenantContext) {
    const sessions = await this.authService.getSessions(user.userId, tenant.tenantId, user.sessionId);
    return { success: true, data: sessions };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ sessions: { ttl: 60, limit: 10 } })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: UserContext,
    @CurrentTenant() tenant: TenantContext,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    await this.authService.revokeSession(sessionId, user.userId, tenant.tenantId);
    if (sessionId === user.sessionId) {
      this.clearCookies(res);
    }
    return { success: true, data: { message: 'Session revoked' } };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ me: { ttl: 60, limit: 60 } })
  async getMe(@CurrentUser() user: UserContext, @CurrentTenant() tenant: TenantContext) {
    const data = await this.authService.getMe(user.userId, tenant.tenantId);
    return { success: true, data };
  }

  private setCookies(res: FastifyReply, accessToken: string, refreshToken?: string) {
    res.setCookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 900, // 15 minutes in seconds
      path: '/',
    });

    if (refreshToken) {
      res.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 604800, // 7 days in seconds
        path: '/api/v1/auth/refresh',
      });
    }
  }

  private clearCookies(res: FastifyReply) {
    res.setCookie('access_token', '', { maxAge: 0, path: '/' });
    res.setCookie('refresh_token', '', { maxAge: 0, path: '/api/v1/auth/refresh' });
  }
}
