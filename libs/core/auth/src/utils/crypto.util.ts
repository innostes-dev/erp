import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const keyString = process.env.JWT_SECRET || '01234567890123456789012345678901';
const ENCRYPTION_KEY = Buffer.from(keyString.substring(0, 32), 'utf8');

export function encryptEmail(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

export function decryptEmail(text: string): string {
  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text;
    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return text;
  }
}

export function hashEmail(email: string): string {
  return crypto.createHmac('sha256', keyString).update(email.toLowerCase().trim()).digest('hex');
}
