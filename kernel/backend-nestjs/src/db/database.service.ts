import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { APP_CONFIG, AppConfig } from '../config/env';

/** Anything that can run a parameterised query: the pool or a transaction client. */
export interface Queryable {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}

export interface PingReport {
  status: 'HEALTHY' | 'UNHEALTHY';
  latency_ms?: number;
  error?: string;
}

export function buildPoolConfig(cfg: AppConfig['db']): PoolConfig {
  const base: PoolConfig = {
    max: cfg.poolSize,
    connectionTimeoutMillis: cfg.connectionTimeoutMs,
    idleTimeoutMillis: 30_000,
    application_name: 'innostes-kernel-nestjs',
  };
  if (cfg.url) return { ...base, connectionString: cfg.url };
  const ssl =
    cfg.sslMode === 'disable' || cfg.sslMode === 'prefer' || cfg.sslMode === 'allow'
      ? undefined
      : { rejectUnauthorized: cfg.sslMode === 'verify-full' || cfg.sslMode === 'verify-ca' };
  return {
    ...base,
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    ssl,
  };
}

@Injectable()
export class DatabaseService implements Queryable, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly pool: Pool;

  constructor(@Inject(APP_CONFIG) cfg: AppConfig) {
    this.pool = new Pool(buildPoolConfig(cfg.db));
    // An idle client erroring must never crash the process.
    this.pool.on('error', (err) => this.logger.error({ err }, 'Unexpected PostgreSQL pool error'));
  }

  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, values);
  }

  /** Run `fn` inside a transaction; commits on success, rolls back (and rethrows) on any error. */
  async tx<T>(fn: (db: Queryable) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        this.logger.error({ err: rollbackErr }, 'ROLLBACK failed');
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async ping(timeoutMs = 3000): Promise<PingReport> {
    const started = process.hrtime.bigint();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.pool.query('SELECT 1'),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('database ping timed out')), timeoutMs);
        }),
      ]);
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      return { status: 'HEALTHY', latency_ms: Math.round(ms * 100) / 100 };
    } catch (err) {
      this.logger.warn({ err }, 'Database ping failed');
      return { status: 'UNHEALTHY', error: 'database unreachable' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

/** True for a PostgreSQL unique-violation, optionally restricted to a constraint name. */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as { code?: string; constraint?: string };
  return e?.code === '23505' && (constraint === undefined || e.constraint === constraint);
}
