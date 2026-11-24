import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BlindIndex,
  DecryptionFailedError,
  FieldCipher,
  KeyNotFoundError,
  resolveKey,
  safeEqual,
  sha256Hex,
} from './cipher';
import { generateSecureTempPassword, hashPassword, verifyPassword } from './password';
import { TokenService, generateApiKey, generateRefreshToken } from './tokens';

interface Vectors {
  hexKey: string;
  rawKey: string;
  pepper: string;
  jwtSecret: string;
  envelopes: { plaintext: string; version: number; envelope: string }[];
  blindIndex: { value: string; hash: string }[];
  accessToken: string;
  password: string;
  bcryptHash: string;
  bcryptHash2y: string;
  refreshToken: string;
  refreshTokenSha256: string;
}
const v: Vectors = JSON.parse(readFileSync(join(__dirname, '../../test/fixtures/python-vectors.json'), 'utf8'));
const keys = { 1: v.hexKey, 2: v.rawKey };

describe('FieldCipher (AES-256-GCM envelope)', () => {
  const cipher = new FieldCipher(keys, 1);

  it.each(v.envelopes.map((e) => [e.plaintext, e.version, e.envelope] as const))(
    'decrypts the Python envelope for %j (key v%i)',
    (plain, _ver, env) => {
      expect(cipher.decrypt(env)).toBe(plain);
    },
  );

  it('produces v<ver>:<12-byte nonce>:<ct||16-byte tag> envelopes', () => {
    const env = cipher.encrypt('hello') as string;
    const [ver, nonce, blob] = env.split(':');
    expect(ver).toBe('v1');
    expect(Buffer.from(nonce, 'base64')).toHaveLength(12);
    expect(Buffer.from(blob, 'base64')).toHaveLength('hello'.length + 16);
    expect(cipher.decrypt(env)).toBe('hello');
  });

  it('uses a fresh nonce each time', () => {
    expect(cipher.encrypt('same')).not.toBe(cipher.encrypt('same'));
  });

  it('honours an explicit key version and passes null through', () => {
    expect(cipher.encrypt('x', 2)?.startsWith('v2:')).toBe(true);
    expect(cipher.encrypt(null)).toBeNull();
    expect(cipher.decrypt(null)).toBeNull();
  });

  it('rejects tampering, bad format and unknown key versions', () => {
    const env = cipher.encrypt('secret') as string;
    const parts = env.split(':');
    const blob = Buffer.from(parts[2], 'base64');
    blob[0] ^= 0xff;
    expect(() => cipher.decrypt(`${parts[0]}:${parts[1]}:${blob.toString('base64')}`)).toThrow(DecryptionFailedError);
    expect(() => cipher.decrypt('not-an-envelope')).toThrow(DecryptionFailedError);
    expect(() => cipher.decrypt(env.replace('v1:', 'v9:'))).toThrow(KeyNotFoundError);
    expect(() => new FieldCipher(keys, 5)).toThrow(KeyNotFoundError);
  });

  it('key resolution: 64 hex chars are decoded, others are UTF-8 padded/truncated to 32 bytes', () => {
    expect(resolveKey(v.hexKey)).toEqual(Buffer.from(v.hexKey, 'hex'));
    const short = resolveKey('abc');
    expect(short).toHaveLength(32);
    expect(short.subarray(0, 3).toString()).toBe('abc');
    expect(short[3]).toBe(0);
    expect(resolveKey('x'.repeat(40))).toHaveLength(32);
  });
});

describe('BlindIndex', () => {
  const bi = new BlindIndex(v.pepper);
  it.each(v.blindIndex.map((b) => [b.value, b.hash] as const))('matches the Python HMAC for %j', (value, hash) => {
    expect(bi.compute(value)).toBe(hash);
  });
  it('is case/whitespace insensitive and empty -> null', () => {
    expect(bi.compute('  ADA@Example.COM ')).toBe(bi.compute('ada@example.com'));
    expect(bi.compute('')).toBeNull();
    expect(bi.compute(null)).toBeNull();
  });
});

describe('passwords (bcrypt)', () => {
  it('verifies Python $2b$ hashes and PHP-style $2y$ hashes', async () => {
    expect(v.bcryptHash.startsWith('$2b$12$')).toBe(true);
    expect(v.bcryptHash2y.startsWith('$2y$12$')).toBe(true);
    expect(await verifyPassword(v.password, v.bcryptHash)).toBe(true);
    expect(await verifyPassword(v.password, v.bcryptHash2y)).toBe(true);
    expect(await verifyPassword('wrong', v.bcryptHash)).toBe(false);
  });
  it('hashes with cost 12 and the $2b$ prefix; garbage hashes never throw', async () => {
    const h = await hashPassword('Another-Passw0rd!');
    expect(h.startsWith('$2b$12$')).toBe(true);
    expect(await verifyPassword('Another-Passw0rd!', h)).toBe(true);
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
  it('temporary passwords meet the complexity contract', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateSecureTempPassword(16);
      expect(p).toHaveLength(16);
      expect((p.match(/[A-Z]/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect((p.match(/[a-z]/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect((p.match(/[0-9]/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect((p.match(/[!@#$%^&*()\-_=+]/g) ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('tokens', () => {
  const svc = new TokenService({
    secret: v.jwtSecret,
    algorithm: 'HS256',
    accessMinutes: 30,
    refreshDays: 7,
    resetMinutes: 60,
  });

  it('decodes a Python-issued access token', () => {
    const p = svc.decode(v.accessToken);
    expect(p).toMatchObject({
      sub: '3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f',
      email: 'ada@example.com',
      token_version: 3,
      is_super_admin: true,
      type: 'access',
    });
  });

  it('issues tokens with the documented claims and 30 minute expiry', () => {
    const t = svc.createAccessToken({ sub: 'u1', email: 'a@b.co', token_version: 2, is_super_admin: false });
    const p = svc.decode(t);
    expect(p).toMatchObject({ sub: 'u1', email: 'a@b.co', token_version: 2, is_super_admin: false, type: 'access' });
    expect((p.exp as number) - (p.iat as number)).toBe(1800);
    expect(JSON.parse(Buffer.from(t.split('.')[0], 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
  });

  it('rejects wrong secrets, expired tokens, alg=none and other algorithms', () => {
    const other = new TokenService({
      secret: 'x'.repeat(40),
      algorithm: 'HS256',
      accessMinutes: 30,
      refreshDays: 7,
      resetMinutes: 60,
    });
    expect(() => other.decode(v.accessToken)).toThrow();
    const expired = new TokenService({
      secret: v.jwtSecret,
      algorithm: 'HS256',
      accessMinutes: -5,
      refreshDays: 7,
      resetMinutes: 60,
    });
    expect(() =>
      svc.decode(expired.createAccessToken({ sub: 'u', email: 'e', token_version: 1, is_super_admin: false })),
    ).toThrow(/expired/);
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"u","type":"access"}').toString('base64url')}.`;
    expect(() => svc.decode(none)).toThrow();
    const hs512 = new TokenService({
      secret: v.jwtSecret,
      algorithm: 'HS512',
      accessMinutes: 30,
      refreshDays: 7,
      resetMinutes: 60,
    });
    expect(() =>
      svc.decode(hs512.createAccessToken({ sub: 'u', email: 'e', token_version: 1, is_super_admin: false })),
    ).toThrow();
  });

  it('password reset tokens carry type and token_version', () => {
    const p = svc.decode(svc.createPasswordResetToken('u1', 4));
    expect(p).toMatchObject({ sub: 'u1', type: 'password_reset', token_version: 4 });
    expect((p.exp as number) - (p.iat as number)).toBe(3600);
  });

  it('refresh tokens are 64 url-safe chars and hash to sha256 hex like Python', () => {
    const t = generateRefreshToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(sha256Hex(v.refreshToken)).toBe(v.refreshTokenSha256);
  });

  it('API keys are inno_live_ + 43 url-safe chars', () => {
    expect(generateApiKey()).toMatch(/^inno_live_[A-Za-z0-9_-]{43}$/);
  });

  it('safeEqual compares in constant time semantics', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
