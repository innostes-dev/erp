/**
 * libs/core/auth/src/lib/auth.controller.ts
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SetupDto } from '../dto/setup.dto';
import { AuthGuard } from '../guards/auth.guard';
import { TenantInterceptor } from '../interceptors/tenant.interceptor';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { parseDevice, extractIp } from '../utils/device.util';
import { UserContext, TenantContext } from '@innostes/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ register: { ttl: 3600, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const device = parseDevice(req.headers['user-agent']);
    const ip = extractIp(req);
    const result = await this.authService.register(dto, device, ip);

    if ('message' in result) {
      return { success: true, data: result };
    }

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { success: true, data: result.user };
  }

  @Post('login')
  @Throttle({ login: { ttl: 900, limit: 10 } })
  @ApiOperation({ summary: 'Login and receive session cookies' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const device = parseDevice(req.headers['user-agent']);
    const ip = extractIp(req);
    const result = await this.authService.login(dto, tenantId, device, ip);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { success: true, data: result.user };
  }

  @Post('refresh')
  @Throttle({ refresh: { ttl: 60, limit: 20 } })
  @ApiOperation({ summary: 'Rotate session tokens using refresh cookie' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const rawToken = req.cookies['__Secure-rt'];
    if (!rawToken) {
      return { success: false, error: { message: 'Refresh token missing', code: 'REFRESH_TOKEN_MISSING' } };
    }

    const result = await this.authService.refresh(rawToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { success: true };
  }

  @Post('forgot-password')
  @Throttle({ 'forgot-password': { ttl: 1800, limit: 3 } })
  @ApiOperation({ summary: 'Request password reset OTP' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: FastifyRequest) {
    const ip = extractIp(req);
    await this.authService.forgotPassword(dto, ip);
    return { success: true, data: { message: 'If the email exists, an OTP was sent.' } };
  }

  @Post('verify-otp')
  @Throttle({ 'verify-otp': { ttl: 600, limit: 5 } })
  @ApiOperation({ summary: 'Verify OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: FastifyRequest) {
    const ip = extractIp(req);
    const result = await this.authService.verifyOtp(dto, ip);
    return { success: true, data: result };
  }

  @Post('reset-password')
  @Throttle({ 'reset-password': { ttl: 600, limit: 3 } })
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: FastifyRequest) {
    const ip = extractIp(req);
    const device = parseDevice(req.headers['user-agent']);
    await this.authService.resetPassword(dto, ip, device);
    return { success: true, data: { message: 'Password has been reset successfully.' } };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @Throttle({ logout: { ttl: 60, limit: 5 } })
  @ApiOperation({ summary: 'Revoke current device session' })
  async logout(
    @CurrentUser() user: UserContext,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    await this.authService.logout(user.sessionId);
    this.clearAuthCookies(res);
    return { success: true, data: { message: 'Logged out' } };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @Throttle({ 'logout-all': { ttl: 60, limit: 3 } })
  @ApiOperation({ summary: 'Revoke all sessions for this user' })
  async logoutAll(
    @CurrentUser() user: UserContext,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    await this.authService.logoutAll(user.userId);
    this.clearAuthCookies(res);
    return { success: true, data: { message: 'All sessions revoked' } };
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ 'sessions-list': { ttl: 60, limit: 30 } })
  @ApiOperation({ summary: 'List all active device sessions' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getSessions(
    @CurrentUser() user: UserContext,
    @CurrentTenant() tenant: TenantContext
  ) {
    const data = await this.authService.getSessions(user.userId, tenant.tenantId, user.sessionId);
    return { success: true, data };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ 'sessions-revoke': { ttl: 60, limit: 10 } })
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async revokeSession(
    @Param('sessionId') targetId: string,
    @CurrentUser() user: UserContext,
    @CurrentTenant() tenant: TenantContext,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    await this.authService.revokeSession(targetId, user.userId, tenant.tenantId);
    if (targetId === user.sessionId) {
      this.clearAuthCookies(res);
    }
    return { success: true, data: { message: 'Session revoked' } };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @UseInterceptors(TenantInterceptor)
  @Throttle({ me: { ttl: 60, limit: 60 } })
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getMe(
    @CurrentUser() user: UserContext,
    @CurrentTenant() tenant: TenantContext
  ) {
    const data = await this.authService.getMe(user.userId, tenant.tenantId);
    return { success: true, data };
  }

  private setAuthCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
    res.setCookie('__Host-at', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.setCookie('__Secure-rt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });
  }

  private clearAuthCookies(res: FastifyReply) {
    res.setCookie('__Host-at', '', { maxAge: 0, path: '/' });
    res.setCookie('__Secure-rt', '', { maxAge: 0, path: '/api/v1/auth/refresh' });
  }

  @Get('setup-status')
  @ApiOperation({ summary: 'Check if system initialization is required' })
  async getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  @Post('setup')
  @ApiOperation({ summary: 'Initial system setup (Tenant, Main Branch, Super Admin)' })
  async initializeSetup(@Body() dto: SetupDto) {
    console.log('>>> [AuthController] Received POST /auth/setup');
    console.log('>>> Payload:', JSON.stringify(dto));
    return this.authService.initializeSetup(dto);
  }
}

