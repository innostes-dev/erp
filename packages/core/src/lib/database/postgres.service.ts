import { Pool, PoolConfig } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { IDatabaseService } from './database.interface';
import * as schema from './schemas';

export class PostgresDatabaseService implements IDatabaseService {
  private readonly pool: Pool;
  private readonly db: NodePgDatabase<typeof schema>;

  constructor(config?: PoolConfig) {
    const connectionString = config?.connectionString ?? process.env['DATABASE_URL'];

    this.pool = new Pool(
      connectionString
        ? { connectionString, ...config }
        : {
            host: config?.host ?? process.env['DB_HOST'] ?? 'localhost',
            port: config?.port ?? Number(process.env['DB_PORT'] ?? 5432),
            user: config?.user ?? process.env['DB_USER'],
            password: config?.password ?? process.env['DB_PASSWORD'],
            database: config?.database ?? process.env['DB_NAME'],
            max: config?.max ?? 20,
            idleTimeoutMillis: config?.idleTimeoutMillis ?? 30000,
            connectionTimeoutMillis: config?.connectionTimeoutMillis ?? 2000,
            ...config,
          }
    );

    this.db = drizzle(this.pool, { schema });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client under Drizzle pool', err);
    });
  }

  getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (err) {
      console.error('PostgreSQL Drizzle health check failed:', err);
      return false;
    }
  }

  async runMigrations(migrationsFolder = './drizzle'): Promise<void> {
    try {
      console.log('Running Drizzle migrations...');
      await migrate(this.db, { migrationsFolder });
      console.log('Drizzle migrations completed successfully!');
    } catch (err) {
      console.error('Drizzle migration failed:', err);
      throw err;
    }
  }
}
