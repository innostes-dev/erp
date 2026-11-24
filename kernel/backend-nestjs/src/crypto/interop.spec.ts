import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BlindIndex, FieldCipher } from './cipher';
import { hashPassword } from './password';
import { TokenService } from './tokens';

/**
 * Node -> Python direction: artifacts produced here are verified by the FastAPI reference implementation.
 * Skipped (with a notice) when the reference virtualenv is not available.
 */
const repoRoot = resolve(__dirname, '../../../..');
const python = join(repoRoot, 'apps/api-server/.venv/bin/python');
const script = join(__dirname, '../../test/fixtures/verify_node_artifacts.py');
const available = existsSync(python) && existsSync(join(repoRoot, 'kernel/backend/kernel'));
const v = JSON.parse(readFileSync(join(__dirname, '../../test/fixtures/python-vectors.json'), 'utf8'));

(available ? describe : describe.skip)('Node artifacts verified by the Python reference', () => {
  it('AES-GCM envelopes, blind indexes, JWTs and bcrypt hashes are accepted by Python', async () => {
    const cipher = new FieldCipher({ 1: v.hexKey, 2: v.rawKey }, 1);
    const plaintexts = ['ada@example.com', 'Ünïcödé ✓ 日本語', ''];
    const envelopes = plaintexts.map((p) => ({ plaintext: p, envelope: cipher.encrypt(p) as string }));
    const blindValues = ['Ada@Example.com', '  ada@example.com  '];
    const tokens = new TokenService({
      secret: v.jwtSecret,
      algorithm: 'HS256',
      accessMinutes: 30,
      refreshDays: 7,
      resetMinutes: 60,
    });
    const jwtToken = tokens.createAccessToken({
      sub: 'u-1',
      email: 'ada@example.com',
      token_version: 5,
      is_super_admin: true,
    });
    const hash = await hashPassword('Str0ng-Passw0rd!');

    const proc = spawnSync(python, ['-I', script], {
      input: JSON.stringify({
        hexKey: v.hexKey,
        rawKey: v.rawKey,
        pepper: v.pepper,
        jwtSecret: v.jwtSecret,
        envelopes,
        blindValues,
        jwt: jwtToken,
        bcrypt: [
          { plain: 'Str0ng-Passw0rd!', hash },
          { plain: 'nope', hash },
        ],
      }),
      env: { ...process.env, PYTHONPATH: join(repoRoot, 'kernel/backend') },
      encoding: 'utf8',
    });
    expect(proc.status).toBe(0);
    const out = JSON.parse(proc.stdout);
    expect(out.decrypted).toEqual(plaintexts);
    const bi = new BlindIndex(v.pepper);
    expect(out.blind).toEqual(blindValues.map((b) => bi.compute(b)));
    expect(out.jwt).toMatchObject({
      sub: 'u-1',
      email: 'ada@example.com',
      token_version: 5,
      is_super_admin: true,
      type: 'access',
    });
    expect(out.bcrypt).toEqual([true, false]);
  });
});
