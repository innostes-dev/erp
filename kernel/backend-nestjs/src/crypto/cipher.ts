import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export class CryptoError extends Error {}
export class KeyNotFoundError extends CryptoError {}
export class DecryptionFailedError extends CryptoError {}

const ENVELOPE_REGEX = /^v(\d+):([A-Za-z0-9+/=]+):([A-Za-z0-9+/=]+)$/;
const TAG_LENGTH = 16;
const NONCE_LENGTH = 12;

/** Resolve a configured key: 64 hex chars are hex-decoded, otherwise UTF-8 padded/truncated to 32 bytes. */
export function resolveKey(raw: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const bytes = Buffer.from(raw, 'utf8').subarray(0, 32);
  const out = Buffer.alloc(32, 0);
  bytes.copy(out);
  return out;
}

/**
 * AES-256-GCM envelope encryption compatible with the FastAPI reference:
 * `v<version>:<base64 12-byte nonce>:<base64 ciphertext||16-byte tag>`, no AAD.
 */
export class FieldCipher {
  private readonly keyring = new Map<number, Buffer>();

  constructor(
    keys: Record<number, string>,
    private readonly currentVersion: number,
  ) {
    for (const [version, raw] of Object.entries(keys)) this.keyring.set(Number(version), resolveKey(raw));
    if (!this.keyring.has(currentVersion)) {
      throw new KeyNotFoundError(`Active encryption key version ${currentVersion} not found in keyring.`);
    }
  }

  encrypt(plaintext: string | null | undefined, version?: number): string | null {
    if (plaintext === null || plaintext === undefined) return null;
    const target = version ?? this.currentVersion;
    const key = this.keyring.get(target);
    if (!key) throw new KeyNotFoundError(`Encryption key version ${target} not found in keyring.`);
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: TAG_LENGTH });
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v${target}:${nonce.toString('base64')}:${Buffer.concat([ct, tag]).toString('base64')}`;
  }

  decrypt(envelope: string | null | undefined): string | null {
    if (envelope === null || envelope === undefined) return null;
    const m = ENVELOPE_REGEX.exec(envelope.trim());
    if (!m) throw new DecryptionFailedError('Invalid ciphertext envelope format.');
    const version = Number(m[1]);
    const nonce = Buffer.from(m[2], 'base64');
    const blob = Buffer.from(m[3], 'base64');
    const key = this.keyring.get(version);
    if (!key) throw new KeyNotFoundError(`Cannot decrypt: Key version ${version} not in active keyring.`);
    if (nonce.length !== NONCE_LENGTH || blob.length < TAG_LENGTH) {
      throw new DecryptionFailedError('Ciphertext integrity verification failed or data corrupted.');
    }
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, nonce, { authTagLength: TAG_LENGTH });
      decipher.setAuthTag(blob.subarray(blob.length - TAG_LENGTH));
      return Buffer.concat([decipher.update(blob.subarray(0, blob.length - TAG_LENGTH)), decipher.final()]).toString(
        'utf8',
      );
    } catch {
      throw new DecryptionFailedError('Ciphertext integrity verification failed or data corrupted.');
    }
  }

  envelopeVersion(envelope: string): number {
    const m = ENVELOPE_REGEX.exec(envelope.trim());
    if (!m) throw new DecryptionFailedError('Invalid ciphertext envelope format.');
    return Number(m[1]);
  }
}

/** Deterministic HMAC-SHA256 hex digest of trim(lower(value)) used for exact lookups on encrypted PII. */
export class BlindIndex {
  constructor(private readonly pepper: string) {}

  compute(value: string | null | undefined): string | null {
    if (!value) return null;
    return createHmac('sha256', Buffer.from(this.pepper, 'utf8'))
      .update(value.trim().toLowerCase(), 'utf8')
      .digest('hex');
  }
}

export const sha256Hex = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');

/** Constant-time string comparison (both sides are hashed first so lengths do not leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}
