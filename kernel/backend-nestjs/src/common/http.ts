import { isIP } from 'node:net';
import type { Request } from 'express';

/**
 * Client address as resolved by Express according to `TRUST_PROXY` (`req.ip`): X-Forwarded-For is honoured only for
 * hops the operator declared as trusted proxies, otherwise the socket address is used. Reading the header directly would
 * let any client forge the IP stored in audit rows, sessions and devices (and evade IP-based controls).
 */
export function clientIp(req: Request): string | null {
  const ip = req.ip ?? req.socket?.remoteAddress ?? null;
  if (!ip) return null;
  return (ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip).slice(0, 45);
}

export function userAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 512) : null;
}

export function correlationId(req: Request): string | null {
  const h = req.headers['x-correlation-id'];
  const v = Array.isArray(h) ? h[0] : h;
  return typeof v === 'string' && v.length > 0 ? v.slice(0, 128) : ((req as Request & { id?: string }).id ?? null);
}

export function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
