/**
 * libs/core/auth/src/utils/device.util.ts
 * Parses a coarse device fingerprint from the User-Agent and extracts the real client IP.
 */
import { FastifyRequest } from 'fastify';

export function parseDevice(userAgent: string | undefined): {
  deviceName: string | null;
  deviceType: 'web' | 'mobile' | 'desktop' | null;
} {
  if (!userAgent) return { deviceName: null, deviceType: null };
  const ua = userAgent.toLowerCase();

  let deviceType: 'web' | 'mobile' | 'desktop' = 'web';
  if (/android|iphone|ipad|mobile/.test(ua)) deviceType = 'mobile';
  else if (/electron/.test(ua)) deviceType = 'desktop';

  let browser = 'Unknown browser';
  if (ua.includes('edg/'))     browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome'))  browser = 'Chrome';
  else if (ua.includes('safari'))  browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  let os = 'Unknown OS';
  if (ua.includes('windows'))      os = 'Windows';
  else if (ua.includes('mac os'))  os = 'macOS';
  else if (ua.includes('linux'))   os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceName: `${browser} on ${os}`, deviceType };
}

/**
 * Extracts the real client IP, honouring the X-Forwarded-For header
 * set by Apache mod_proxy sitting in front of NestJS on cPanel.
 */
export function extractIp(request: FastifyRequest): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return raw.split(',')[0].trim();
  }
  return (request.ip as string) ?? null;
}
