/**
 * libs/core/database/src/lib/database.service.ts
 * Drizzle database service using Neon serverless HTTP driver.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public db: any; // Type handled by drizzle

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema });
  }

  async onModuleInit() {
    this.logger.log('Database connected (Neon HTTP driver)');
  }

  async onModuleDestroy() {
    this.logger.log('Database service destroyed');
  }
}
