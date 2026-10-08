import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export class PasswordService {
  /**
   * Hashes a plain text password using scrypt with a random salt.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies a plain text password against a stored scrypt hash string (salt:key).
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, keyHex] = storedHash.split(':');
      if (!salt || !keyHex) return false;

      const key = Buffer.from(keyHex, 'hex');
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

      return timingSafeEqual(key, derivedKey);
    } catch {
      return false;
    }
  }
}
