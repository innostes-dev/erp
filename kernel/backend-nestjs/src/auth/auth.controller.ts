import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuditService } from '../audit/audit.service';
import { ErrorCode, ForbiddenError, InvalidTokenError } from '../common/errors';
import { clientIp, correlationId, userAgent } from '../common/http';
import { RATE_TTL_MS, limitFor } from '../common/rate-limits';
import { UuidParamPipe, parseOptionalUuidHeader } from '../common/validation';
import { APP_CONFIG, AppConfig } from '../config/env';
import { RbacService } from '../rbac/rbac.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { UserRow } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { ApiKeysService, toApiKeyRead } from './api-keys.service';
import {
  ChangePasswordRequest,
  CreateApiKeyRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
} from './auth.dto';
import { AuthContext, AuthGuard, CurrentAuth, CurrentUser } from './auth.guard';
import { AuthService } from './auth.service';

const FORGOT_MESSAGE =
  'If an account exists with that email address, a password reset link and temporary password have been sent.';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly apiKeys: ApiKeysService,
    private readonly tenancy: TenancyService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
  ) {}

  private setAuthCookies(res: Response, access: string, refresh: string): void {
    const base = { httpOnly: true, secure: this.cfg.cookieSecure, sameSite: 'lax' as const };
    res.cookie('access_token', access, { ...base, path: '/', maxAge: 900 * 1000 });
    res.cookie('refresh_token', refresh, { ...base, path: '/auth', maxAge: 7 * 86400 * 1000 });
  }

  private actor(user: UserRow): { actorId: string; actorName: string | null } {
    return { actorId: user.id, actorName: this.users.displayName(user) || null };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: limitFor('login'), ttl: RATE_TTL_MS } })
  @ApiOperation({ summary: 'Authenticate with email and password', operationId: 'auth_login' })
  async login(@Body() body: LoginRequest, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = clientIp(req);
    const ua = userAgent(req);
    const result = await this.auth.login(body, ip, ua);
    const name = `${result.user.first_name} ${result.user.last_name ?? ''}`.trim() || result.user.email;
    await this.audit.safeRecord({
      action: 'LOGIN',
      entityType: 'user',
      entityId: result.user.id,
      entityName: name,
      actorId: result.user.id,
      actorEmail: result.user.email,
      actorName: name,
      ipAddress: ip,
      userAgent: ua,
      correlationId: correlationId(req),
      reason: 'User authenticated via password credentials',
    });
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: limitFor('refresh'), ttl: RATE_TTL_MS } })
  @ApiOperation({ summary: 'Rotate refresh token', operationId: 'auth_refresh' })
  async refresh(@Body() body: RefreshTokenRequest, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = body.refresh_token || (req.cookies as Record<string, string> | undefined)?.refresh_token || '';
    if (!token) throw new InvalidTokenError('Refresh token missing.');
    const result = await this.auth.refresh(token, clientIp(req), userAgent(req));
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: limitFor('forgotPassword'), ttl: RATE_TTL_MS } })
  @ApiOperation({ summary: 'Request password reset', operationId: 'auth_forgot_password' })
  async forgotPassword(@Body() body: ForgotPasswordRequest) {
    await this.auth.forgotPassword(body.email);
    return { message: FORGOT_MESSAGE };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: limitFor('forgotPassword'), ttl: RATE_TTL_MS } })
  @ApiOperation({ summary: 'Reset password with token', operationId: 'auth_reset_password' })
  async resetPassword(@Body() body: ResetPasswordRequest) {
    await this.auth.resetPasswordWithToken(body.token, body.new_password);
    return { message: 'Password has been successfully reset. You can now log in.' };
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Change user password', operationId: 'auth_change_password' })
  async changePassword(@Body() body: ChangePasswordRequest, @CurrentUser() user: UserRow, @Req() req: Request) {
    await this.auth.changePassword(user.id, body.current_password, body.new_password);
    const { actorId, actorName } = this.actor(user);
    await this.audit.safeRecord({
      action: 'PASSWORD_RESET',
      entityType: 'user',
      entityId: user.id,
      entityName: actorName ?? 'User',
      actorId,
      actorName,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      correlationId: correlationId(req),
      reason: 'User changed account password',
    });
    return { message: 'Password has been changed successfully.' };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Revoke session tokens', operationId: 'auth_logout' })
  async logout(
    @Body() body: LogoutRequest,
    @CurrentUser() user: UserRow,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.id, body);
    const { actorId, actorName } = this.actor(user);
    await this.audit.safeRecord({
      action: 'LOGOUT',
      entityType: 'user',
      entityId: user.id,
      entityName: actorName ?? 'User',
      actorId,
      actorName,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      correlationId: correlationId(req),
      reason: body.logout_all ? 'User logged out of all active sessions' : 'User logged out of active session',
    });
    const base = { httpOnly: true, secure: this.cfg.cookieSecure, sameSite: 'lax' as const };
    res.clearCookie('access_token', { ...base, path: '/' });
    res.clearCookie('refresh_token', { ...base, path: '/auth' });
    return { message: 'Logged out successfully.' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiHeader({ name: 'X-Tenant-ID', required: false, description: 'Active tenant context override.' })
  @ApiHeader({
    name: 'If-None-Match',
    required: false,
    description: 'ETag token version for conditional revalidation.',
  })
  @ApiOperation({ summary: 'Get current user profile', operationId: 'auth_get_me' })
  async me(@CurrentUser() user: UserRow, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tenantId = parseOptionalUuidHeader(req.headers['x-tenant-id'], 'X-Tenant-ID');
    const etag = `"${user.token_version}"`;
    if (req.headers['if-none-match']?.trim() === etag) {
      res.status(304);
      res.setHeader('ETag', etag);
      return undefined;
    }
    const profile = await this.auth.getUserProfile(user, tenantId);
    res.setHeader('ETag', etag);
    return profile;
  }

  // ---------------------------------------------------------------- API keys

  /**
   * Tenant whose keys are managed. Personal access tokens cannot manage keys (a leaked or narrowly scoped key must not be
   * able to mint a permanent '*' key), and non-super-admins are confined to tenants they are an active member of.
   */
  private async keyTenantId(auth: AuthContext, req: Request): Promise<string> {
    if (auth.apiKey)
      throw new ForbiddenError(
        'API keys cannot manage API keys; authenticate with a user token.',
        ErrorCode.PERMISSION_DENIED,
      );
    const header = parseOptionalUuidHeader(req.headers['x-tenant-id'], 'X-Tenant-ID');
    const tenantId = await this.tenancy.resolveTenantForUser(auth.user, header);
    await this.tenancy.getOrThrow(tenantId); // 404 tenant_not_found instead of an FK error
    return tenantId;
  }

  /** Keys are private to their creator unless the caller is a super-admin or may manage tenant members. */
  private async manageAllKeys(user: UserRow, tenantId: string): Promise<boolean> {
    return user.is_super_admin || (await this.rbac.hasPermission(user, 'tenancy.members.manage', tenantId));
  }

  @Get('api-keys')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'List tenant API keys', operationId: 'auth_list_api_keys' })
  async listApiKeys(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    const tenantId = await this.keyTenantId(auth, req);
    const all = await this.manageAllKeys(auth.user, tenantId);
    const keys = await this.apiKeys.list(tenantId, all ? undefined : auth.user.id);
    return { items: keys.map(toApiKeyRead) };
  }

  @Post('api-keys')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Generate API key', operationId: 'auth_create_api_key' })
  async createApiKey(@Body() body: CreateApiKeyRequest, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    const tenantId = await this.keyTenantId(auth, req);
    const { key, rawKey } = await this.apiKeys.create(
      tenantId,
      auth.user.id,
      body.name,
      body.scopes,
      body.expires_in_days,
    );
    const { actorId, actorName } = this.actor(auth.user);
    await this.audit.safeRecord({
      action: 'CREATE',
      entityType: 'api_key',
      entityId: key.id,
      entityName: key.name,
      changes: { name: { old: null, new: key.name }, scopes: { old: null, new: key.scopes } },
      tenantId,
      actorId,
      actorName,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      correlationId: correlationId(req),
      reason: `Generated API key '${key.name}'`,
    });
    return { ...toApiKeyRead(key), raw_key: rawKey };
  }

  @Delete('api-keys/:key_id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Revoke API key', operationId: 'auth_revoke_api_key' })
  async revokeApiKey(
    @Param('key_id', UuidParamPipe) keyId: string,
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
  ) {
    const tenantId = await this.keyTenantId(auth, req);
    const all = await this.manageAllKeys(auth.user, tenantId);
    const revoked = await this.apiKeys.revoke(keyId, tenantId, all ? undefined : auth.user.id);
    const { actorId, actorName } = this.actor(auth.user);
    await this.audit.safeRecord({
      action: 'DELETE',
      entityType: 'api_key',
      entityId: keyId,
      entityName: revoked.name,
      changes: { is_active: { old: true, new: false } },
      tenantId,
      actorId,
      actorName,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      correlationId: correlationId(req),
      reason: `Revoked API key '${revoked.name}'`,
    });
    return toApiKeyRead(revoked);
  }
}
