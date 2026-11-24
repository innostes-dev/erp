import { Global, Module } from '@nestjs/common';
import { ApiKeysService } from './auth/api-keys.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { EmailService } from './auth/email.service';
import { AuditService } from './audit/audit.service';
import { APP_CONFIG, AppConfig, loadConfig } from './config/env';
import { TokenService } from './crypto/tokens';
import { DatabaseService } from './db/database.service';
import { PermissionGuard } from './rbac/permission.guard';
import { RbacService } from './rbac/rbac.service';
import { InstallStateService } from './setup/install-state.service';
import { SetupService } from './setup/setup.service';
import { SetupTokenService } from './setup/setup-token.service';
import { MetricsService } from './system/metrics.service';
import { TenancyService } from './tenancy/tenancy.service';
import { DevicesService } from './users/devices.service';
import { UsersService } from './users/users.service';

const providers = [
  { provide: APP_CONFIG, useFactory: (): AppConfig => loadConfig() },
  { provide: TokenService, useFactory: (cfg: AppConfig) => new TokenService(cfg.jwt), inject: [APP_CONFIG] },
  DatabaseService,
  AuditService,
  UsersService,
  DevicesService,
  RbacService,
  TenancyService,
  ApiKeysService,
  EmailService,
  AuthService,
  AuthGuard,
  PermissionGuard,
  InstallStateService,
  SetupTokenService,
  SetupService,
  MetricsService,
];

/** Shared singletons (config, database, domain services) available to every feature module. */
@Global()
@Module({ providers, exports: providers })
export class CoreModule {}
