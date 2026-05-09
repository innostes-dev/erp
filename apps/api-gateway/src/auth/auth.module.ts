/**
 * apps/api-gateway/src/auth/auth.module.ts
 * Authentication module wiring.
 */
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: '15m',
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { name: 'register', ttl: 3600, limit: 5 },
        { name: 'login', ttl: 900, limit: 10 },
        { name: 'refresh', ttl: 60, limit: 20 },
        { name: 'logout', ttl: 60, limit: 5 },
        { name: 'logout-all', ttl: 60, limit: 3 },
        { name: 'sessions', ttl: 60, limit: 30 },
        { name: 'me', ttl: 60, limit: 60 },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    RoleGuard,
    TenantInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [AuthService, AuthGuard, RoleGuard, TenantInterceptor],
})
export class AuthModule {}
