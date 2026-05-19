/**
 * libs/core/auth/src/lib/auth.module.ts
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@innostes/core/database';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { TenantInterceptor } from '../interceptors/tenant.interceptor';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    DatabaseModule,
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
    ThrottlerModule.forRoot([
      { name: 'register', ttl: 3600, limit: 5 },
      { name: 'login', ttl: 900, limit: 10 },
      { name: 'refresh', ttl: 60, limit: 20 },
      { name: 'logout', ttl: 60, limit: 5 },
      { name: 'logout-all', ttl: 60, limit: 3 },
      { name: 'sessions-list', ttl: 60, limit: 30 },
      { name: 'sessions-revoke', ttl: 60, limit: 10 },
      { name: 'me', ttl: 60, limit: 60 },
    ]),
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
