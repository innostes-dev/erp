/**
 * libs/core/logger/src/lib/logger.module.ts
 *
 * Dynamic module — call LoggerModule.register({ transports: [...] }) to
 * configure which transports are active per application.
 *
 * Example (api-gateway AppModule):
 *
 *   LoggerModule.register({
 *     transports: [
 *       new FileTransport({ filePath: 'logs/api.log' }),
 *       new ConsoleTransport(),
 *       // new HttpTransport({ url: 'https://logs.example.com/ingest', apiKey: '...' }),
 *     ],
 *   })
 */
import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiLoggerService } from './api-logger.service';
import { ApiLoggerMiddleware } from './api-logger.middleware';
import { ILogTransport, LOG_TRANSPORTS } from './logger.interface';

export interface LoggerModuleOptions {
  /** One or more transport implementations */
  transports: ILogTransport[];
  /** Apply the HTTP middleware globally (default: true) */
  enableMiddleware?: boolean;
}

@Module({})
export class LoggerModule implements NestModule {
  private static enableMiddleware = true;

  static register(options: LoggerModuleOptions): DynamicModule {
    LoggerModule.enableMiddleware = options.enableMiddleware ?? true;

    return {
      module: LoggerModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: LOG_TRANSPORTS,
          useValue: options.transports,
        },
        ApiLoggerService,
        ApiLoggerMiddleware,
      ],
      exports: [ApiLoggerService, ApiLoggerMiddleware],
      global: true,   // Available everywhere without re-importing
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    if (LoggerModule.enableMiddleware) {
      consumer.apply(ApiLoggerMiddleware).forRoutes('*');
    }
  }
}
