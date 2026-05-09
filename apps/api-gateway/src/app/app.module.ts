import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ModuleBridge } from '@innostes/core/bridge';
import { RegistryController } from './registry.controller';
import { TenantContextInterceptor } from '../tenant/tenant-context.interceptor';
import { TenantContextService } from '../tenant/tenant-context.service';
import { BRIDGE_HANDLER_INJECTS, buildBridgeHandlers, MODULE_SERVICES } from './module-catalog';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  controllers: [RegistryController],
  providers: [
    TenantContextService,
    ...MODULE_SERVICES,
    {
      provide: 'BRIDGE_HANDLERS',
      inject: [...BRIDGE_HANDLER_INJECTS],
      useFactory: (...services: Parameters<typeof buildBridgeHandlers>) => buildBridgeHandlers(...services),
    },
    ModuleBridge,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
