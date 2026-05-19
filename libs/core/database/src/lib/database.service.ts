/**
 * libs/core/database/src/lib/database.service.ts
 * Drizzle database service using postgres-js driver (works with any PostgreSQL).
 * For Neon cloud, use the pooled connection string and set ssl: 'require'.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public db: any;
  private client: ReturnType<typeof postgres>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // For Neon cloud, add ?sslmode=require to your DATABASE_URL or
    // pass ssl: 'require' below. For local Postgres, no SSL needed.
    const isNeon = databaseUrl.includes('neon.tech');

    this.client = postgres(databaseUrl, {
      max: 10,
      ...(isNeon ? { ssl: 'require' } : {}),
    });

    this.db = drizzle(this.client, { schema });
  }

  async onModuleInit() {
    this.logger.log('Database connected (postgres-js driver)');
  }

  async onModuleDestroy() {
    await this.client.end();
    this.logger.log('Database connection closed');
  }
}
