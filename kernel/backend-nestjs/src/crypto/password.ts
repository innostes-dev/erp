import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';

export const BCRYPT_COST = 12;

/** Pre-computed hash used to equalise timing when the account does not exist. */
export const DUMMY_BCRYPT_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew.6K2f2D3z8S6mK';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/** Verify against `$2a$`, `$2b$` and PHP `$2y$` hashes. Never throws. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    const normalised = hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
    return await bcrypt.compare(plain, normalised);
  } catch {
    return false;
  }
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+';
const pick = (set: string): string => set[randomInt(set.length)];

/** Cryptographically strong temporary password (>=2 of each class), Fisher-Yates shuffled. */
export function generateSecureTempPassword(length = 16): string {
  const chars = [
    pick(UPPER),
    pick(UPPER),
    pick(LOWER),
    pick(LOWER),
    pick(DIGITS),
    pick(DIGITS),
    pick(SYMBOLS),
    pick(SYMBOLS),
  ];
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
