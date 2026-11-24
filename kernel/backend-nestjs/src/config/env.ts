import { z } from 'zod';

/** Insecure development defaults (identical to the FastAPI reference so that one DB works with every backend). */
export const INSECURE_DEFAULTS = {
  jwtSecret: 'insecure-dev-secret-key-change-in-production',
  encryptionKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  blindIndexPepper: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
} as const;

/** Environments in which the insecure development defaults are tolerated; every other APP_ENV is treated as hardened. */
const DEV_ENVS = new Set(['development', 'dev', 'local', 'test', 'testing']);
export const KNOWN_PLACEHOLDER_SETUP_TOKENS = new Set([
  'change-me-setup-token',
  'changeme',
  'change-me',
  'setup',
  'secret',
]);

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : ['true', '1', 'yes', 'on'].includes(v.toLowerCase())));

const int = (def: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .pipe(z.number().int().min(min).max(max));

const csv = (def: string[]) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v === undefined || v.trim() === ''
        ? def
        : v
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
    );

const encryptionKeys = z
  .string()
  .optional()
  .transform((v, ctx): Record<number, string> => {
    if (v === undefined || v.trim() === '') return { 1: INSECURE_DEFAULTS.encryptionKey };
    try {
      const parsed: unknown = JSON.parse(v);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object');
      const out: Record<number, string> = {};
      for (const [k, val] of Object.entries(parsed)) {
        const version = Number(k);
        if (!Number.isInteger(version) || version < 1 || typeof val !== 'string' || val.length === 0) {
          throw new Error(`invalid entry for version "${k}"`);
        }
        out[version] = val;
      }
      if (Object.keys(out).length === 0) throw new Error('empty keyring');
      return out;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ENCRYPTION_KEYS must be a JSON object {"<version>": "<key>"}: ${(e as Error).message}`,
      });
      return z.NEVER;
    }
  });

const schema = z.object({
  APP_NAME: z.string().default('Innostes ERP API'),
  APP_VERSION: z.string().default('0.1.0'),
  APP_ENV: z.string().optional(),
  NODE_ENV: z.string().optional(),
  PORT: int(8001, 1, 65535),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: csv(['http://localhost:4200', 'http://127.0.0.1:4200']),
  TRUST_PROXY: z.string().default('false'),
  COOKIE_SECURE: z.string().optional(),
  AUTO_MIGRATE: bool(false),
  SHUTDOWN_TIMEOUT_MS: int(10000, 0),
  METRICS_ENABLED: bool(false),
  METRICS_TOKEN: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  DB_URI: z.string().optional(),
  DB_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: int(5432, 1, 65535),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('innostes'),
  DB_SSL_MODE: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']).default('prefer'),
  DB_POOL_SIZE: int(10, 1, 200),
  DB_POOL_TIMEOUT: int(30, 1),

  SETUP_ENABLED: bool(true),
  SETUP_TOKEN: z.string().optional(),
  SETUP_TOKEN_FILE: z.string().default('var/setup-token'),

  JWT_SECRET_KEY: z.string().default(INSECURE_DEFAULTS.jwtSecret),
  JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
  ACCESS_TOKEN_EXPIRE_MINUTES: int(30, 1),
  REFRESH_TOKEN_EXPIRE_DAYS: int(7, 1),
  PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int(60, 1),
  TEMP_PASSWORD_EXPIRE_HOURS: int(24, 1),
  MAX_FAILED_LOGIN_ATTEMPTS: int(5, 1),
  ACCOUNT_LOCKOUT_MINUTES: int(15, 1),
  FRONTEND_URL: z.string().default('http://localhost:4200'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: int(587, 1, 65535),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('Innostes ERP <noreply@innostes.com>'),
  SMTP_USE_TLS: bool(true),

  ENCRYPTION_CURRENT_KEY_VERSION: int(1, 1),
  ENCRYPTION_KEYS: encryptionKeys,
  BLIND_INDEX_PEPPER: z.string().default(INSECURE_DEFAULTS.blindIndexPepper),

  RATE_LIMIT_GLOBAL_PER_MINUTE: int(600, 1),
  RATE_LIMIT_LOGIN_PER_MINUTE: int(60, 1),
  RATE_LIMIT_REFRESH_PER_MINUTE: int(60, 1),
  RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE: int(10, 1),
  RATE_LIMIT_SETUP_PER_MINUTE: int(30, 1),
});

export type AppConfig = {
  appName: string;
  appVersion: string;
  appEnv: string;
  isProduction: boolean;
  /** True only for development/test environments (insecure defaults and console mail are tolerated there). */
  isDevLike: boolean;
  port: number;
  host: string;
  logLevel: string;
  corsOrigins: string[];
  trustProxy: boolean | number | string;
  cookieSecure: boolean;
  autoMigrate: boolean;
  shutdownTimeoutMs: number;
  metricsEnabled: boolean;
  metricsToken?: string;
  db: {
    url?: string;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    sslMode: string;
    poolSize: number;
    connectionTimeoutMs: number;
  };
  setup: { enabled: boolean; token?: string; tokenFile: string };
  jwt: {
    secret: string;
    algorithm: 'HS256' | 'HS384' | 'HS512';
    accessMinutes: number;
    refreshDays: number;
    resetMinutes: number;
  };
  auth: { tempPasswordHours: number; maxFailedAttempts: number; lockoutMinutes: number; frontendUrl: string };
  smtp: { host?: string; port: number; username?: string; password?: string; from: string; useTls: boolean };
  crypto: { keys: Record<number, string>; currentVersion: number; blindIndexPepper: string };
  rateLimit: { global: number; login: number; refresh: number; forgotPassword: number; setup: number };
};

export class ConfigError extends Error {}

function parseTrustProxy(v: string): boolean | number | string {
  const lower = v.toLowerCase();
  if (['false', '0', 'no', ''].includes(lower)) return false;
  if (['true', 'yes'].includes(lower)) return true;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

/** Parse and validate the environment. Throws ConfigError with every problem listed. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new ConfigError(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const e = parsed.data;
  // APP_ENV wins; without it NODE_ENV=production hardens the process (fail closed), otherwise development.
  const appEnv =
    e.APP_ENV?.trim() || (e.NODE_ENV?.trim().toLowerCase() === 'production' ? 'production' : 'development');
  const isProduction = ['production', 'prod'].includes(appEnv.toLowerCase());
  // Anything that is not an explicit development/test environment (production, staging, qa, a typo...) is hardened.
  const isDevLike = DEV_ENVS.has(appEnv.toLowerCase());

  if (!e.ENCRYPTION_KEYS[e.ENCRYPTION_CURRENT_KEY_VERSION]) {
    throw new ConfigError(
      `ENCRYPTION_CURRENT_KEY_VERSION=${e.ENCRYPTION_CURRENT_KEY_VERSION} is not present in ENCRYPTION_KEYS`,
    );
  }

  const problems: string[] = [];
  if (!isDevLike) {
    if (e.JWT_SECRET_KEY === INSECURE_DEFAULTS.jwtSecret || e.JWT_SECRET_KEY.length < 32) {
      problems.push('JWT_SECRET_KEY must be set to a unique secret of at least 32 characters');
    }
    if (Object.values(e.ENCRYPTION_KEYS).some((k) => k === INSECURE_DEFAULTS.encryptionKey)) {
      problems.push('ENCRYPTION_KEYS must not contain the insecure development key');
    }
    if (e.BLIND_INDEX_PEPPER === INSECURE_DEFAULTS.blindIndexPepper || e.BLIND_INDEX_PEPPER.length < 32) {
      problems.push('BLIND_INDEX_PEPPER must be set to a unique secret of at least 32 characters');
    }
    if (!(e.DATABASE_URL ?? e.DB_URI ?? e.DB_URL) && !e.DB_PASSWORD) {
      problems.push('DATABASE_URL (or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME) must be configured');
    }
    if (e.SETUP_ENABLED && !e.SETUP_TOKEN) {
      problems.push('SETUP_TOKEN must be set when SETUP_ENABLED=true (or set SETUP_ENABLED=false after installation)');
    } else if (
      e.SETUP_ENABLED &&
      e.SETUP_TOKEN &&
      (e.SETUP_TOKEN.length < 16 || KNOWN_PLACEHOLDER_SETUP_TOKENS.has(e.SETUP_TOKEN.toLowerCase()))
    ) {
      problems.push('SETUP_TOKEN must be a random value of at least 16 characters (not a documented placeholder)');
    }
    for (const [version, key] of Object.entries(e.ENCRYPTION_KEYS)) {
      if (!/^[0-9a-fA-F]{64}$/.test(key) && Buffer.byteLength(key, 'utf8') < 32) {
        problems.push(
          `ENCRYPTION_KEYS["${version}"] must be 64 hex characters (32 bytes); shorter keys are zero-padded`,
        );
      }
    }
    if (e.CORS_ORIGINS.includes('*')) problems.push('CORS_ORIGINS must not contain "*" (credentials are enabled)');
  }
  if (problems.length) {
    throw new ConfigError(
      `Refusing to start ${isProduction ? 'in production' : `in the '${appEnv}' environment`} with insecure configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }

  return {
    appName: e.APP_NAME,
    appVersion: e.APP_VERSION,
    appEnv,
    isProduction,
    isDevLike,
    port: e.PORT,
    host: e.HOST,
    logLevel: e.LOG_LEVEL,
    corsOrigins: e.CORS_ORIGINS,
    trustProxy: parseTrustProxy(e.TRUST_PROXY),
    cookieSecure:
      e.COOKIE_SECURE === undefined ? !isDevLike : ['true', '1', 'yes'].includes(e.COOKIE_SECURE.toLowerCase()),
    autoMigrate: e.AUTO_MIGRATE,
    shutdownTimeoutMs: e.SHUTDOWN_TIMEOUT_MS,
    metricsEnabled: e.METRICS_ENABLED,
    metricsToken: e.METRICS_TOKEN || undefined,
    db: {
      url: e.DATABASE_URL ?? e.DB_URI ?? e.DB_URL,
      host: e.DB_HOST,
      port: e.DB_PORT,
      user: e.DB_USER,
      password: e.DB_PASSWORD,
      database: e.DB_NAME,
      sslMode: e.DB_SSL_MODE,
      poolSize: e.DB_POOL_SIZE,
      connectionTimeoutMs: e.DB_POOL_TIMEOUT * 1000,
    },
    setup: { enabled: e.SETUP_ENABLED, token: e.SETUP_TOKEN || undefined, tokenFile: e.SETUP_TOKEN_FILE },
    jwt: {
      secret: e.JWT_SECRET_KEY,
      algorithm: e.JWT_ALGORITHM,
      accessMinutes: e.ACCESS_TOKEN_EXPIRE_MINUTES,
      refreshDays: e.REFRESH_TOKEN_EXPIRE_DAYS,
      resetMinutes: e.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    },
    auth: {
      tempPasswordHours: e.TEMP_PASSWORD_EXPIRE_HOURS,
      maxFailedAttempts: e.MAX_FAILED_LOGIN_ATTEMPTS,
      lockoutMinutes: e.ACCOUNT_LOCKOUT_MINUTES,
      frontendUrl: e.FRONTEND_URL.replace(/\/+$/, ''),
    },
    smtp: {
      host: e.SMTP_HOST || undefined,
      port: e.SMTP_PORT,
      username: e.SMTP_USERNAME || undefined,
      password: e.SMTP_PASSWORD || undefined,
      from: e.SMTP_FROM,
      useTls: e.SMTP_USE_TLS,
    },
    crypto: {
      keys: e.ENCRYPTION_KEYS,
      currentVersion: e.ENCRYPTION_CURRENT_KEY_VERSION,
      blindIndexPepper: e.BLIND_INDEX_PEPPER,
    },
    rateLimit: {
      global: e.RATE_LIMIT_GLOBAL_PER_MINUTE,
      login: e.RATE_LIMIT_LOGIN_PER_MINUTE,
      refresh: e.RATE_LIMIT_REFRESH_PER_MINUTE,
      forgotPassword: e.RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE,
      setup: e.RATE_LIMIT_SETUP_PER_MINUTE,
    },
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');
