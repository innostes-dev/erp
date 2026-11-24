import { ConfigError, INSECURE_DEFAULTS, loadConfig } from './env';

const prodEnv = (over: Record<string, string> = {}): NodeJS.ProcessEnv => ({
  APP_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@db:5432/x',
  JWT_SECRET_KEY: 'a'.repeat(48),
  ENCRYPTION_KEYS: JSON.stringify({ 1: 'b'.repeat(64) }),
  BLIND_INDEX_PEPPER: 'c'.repeat(48),
  SETUP_TOKEN: 'a-random-setup-token-0123456789',
  ...over,
});

describe('loadConfig', () => {
  it('applies the reference defaults in development', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ appEnv: 'development', isProduction: false, port: 8001, cookieSecure: false });
    expect(c.jwt).toMatchObject({ algorithm: 'HS256', accessMinutes: 30, refreshDays: 7, resetMinutes: 60 });
    expect(c.auth).toMatchObject({ maxFailedAttempts: 5, lockoutMinutes: 15, tempPasswordHours: 24 });
    expect(c.crypto.keys[1]).toBe(INSECURE_DEFAULTS.encryptionKey);
    expect(c.setup.enabled).toBe(true);
  });

  it('parses booleans, lists and numbers', () => {
    const c = loadConfig({
      SETUP_ENABLED: 'false',
      CORS_ORIGINS: 'https://a.example, https://b.example',
      PORT: '9000',
      AUTO_MIGRATE: 'yes',
      TRUST_PROXY: '1',
    });
    expect(c.setup.enabled).toBe(false);
    expect(c.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
    expect(c.port).toBe(9000);
    expect(c.autoMigrate).toBe(true);
    expect(c.trustProxy).toBe(1);
  });

  it('reports every invalid value at once', () => {
    expect(() => loadConfig({ PORT: 'abc', JWT_ALGORITHM: 'none', ACCESS_TOKEN_EXPIRE_MINUTES: '0' })).toThrow(
      ConfigError,
    );
    try {
      loadConfig({ PORT: 'abc', JWT_ALGORITHM: 'none' });
    } catch (e) {
      expect((e as Error).message).toContain('PORT');
      expect((e as Error).message).toContain('JWT_ALGORITHM');
    }
  });

  it('validates ENCRYPTION_KEYS and the active key version', () => {
    expect(() => loadConfig({ ENCRYPTION_KEYS: 'not-json' })).toThrow(ConfigError);
    expect(() => loadConfig({ ENCRYPTION_KEYS: '{"1":"k"}', ENCRYPTION_CURRENT_KEY_VERSION: '2' })).toThrow(
      /ENCRYPTION_CURRENT_KEY_VERSION/,
    );
    expect(
      loadConfig({ ENCRYPTION_KEYS: '{"1":"k","2":"j"}', ENCRYPTION_CURRENT_KEY_VERSION: '2' }).crypto.currentVersion,
    ).toBe(2);
  });

  it('accepts a fully configured production environment', () => {
    const c = loadConfig(prodEnv());
    expect(c.isProduction).toBe(true);
    expect(c.cookieSecure).toBe(true);
  });

  it.each([
    ['JWT_SECRET_KEY', { JWT_SECRET_KEY: INSECURE_DEFAULTS.jwtSecret }],
    ['JWT_SECRET_KEY (too short)', { JWT_SECRET_KEY: 'short' }],
    ['ENCRYPTION_KEYS', { ENCRYPTION_KEYS: JSON.stringify({ 1: INSECURE_DEFAULTS.encryptionKey }) }],
    ['BLIND_INDEX_PEPPER', { BLIND_INDEX_PEPPER: INSECURE_DEFAULTS.blindIndexPepper }],
    ['SETUP_TOKEN', { SETUP_TOKEN: '' }],
    ['CORS_ORIGINS', { CORS_ORIGINS: '*' }],
  ])('refuses to boot in production with insecure %s', (name, over) => {
    expect(() => loadConfig(prodEnv(over))).toThrow(/Refusing to start in production/);
    expect(() => loadConfig(prodEnv(over))).toThrow(new RegExp(name.split(' ')[0]));
  });

  it.each([
    ['a documented placeholder', 'change-me-setup-token'],
    ['a short value', 'short-token'],
  ])('refuses a SETUP_TOKEN that is %s in production', (_n, token) => {
    expect(() => loadConfig(prodEnv({ SETUP_TOKEN: token }))).toThrow(/SETUP_TOKEN/);
  });

  it('refuses short encryption keys that would be zero-padded in production', () => {
    expect(() => loadConfig(prodEnv({ ENCRYPTION_KEYS: JSON.stringify({ 1: 'short-key' }) }))).toThrow(
      /ENCRYPTION_KEYS/,
    );
  });

  it('treats any non-development APP_ENV (e.g. staging, typos) as hardened and fails closed', () => {
    const insecure = { JWT_SECRET_KEY: INSECURE_DEFAULTS.jwtSecret };
    expect(() => loadConfig(prodEnv({ APP_ENV: 'staging', ...insecure }))).toThrow(/'staging' environment/);
    expect(() => loadConfig(prodEnv({ APP_ENV: 'prodution', ...insecure }))).toThrow(ConfigError);
    expect(loadConfig(prodEnv({ APP_ENV: 'staging' })).cookieSecure).toBe(true);
    expect(loadConfig({ APP_ENV: 'development' }).isDevLike).toBe(true);
    expect(loadConfig({ APP_ENV: 'test' }).isDevLike).toBe(true);
  });

  it('NODE_ENV=production hardens the process when APP_ENV is not set', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/Refusing to start in production/);
    expect(loadConfig({ NODE_ENV: 'production', ...prodEnv(), APP_ENV: '' }).isProduction).toBe(true);
  });

  it('refuses production without database configuration', () => {
    const env = prodEnv();
    delete env.DATABASE_URL;
    expect(() => loadConfig(env)).toThrow(/DATABASE_URL/);
  });

  it('allows production without a setup token once web setup is disabled', () => {
    expect(loadConfig(prodEnv({ SETUP_ENABLED: 'false', SETUP_TOKEN: '' })).setup.enabled).toBe(false);
  });
});
