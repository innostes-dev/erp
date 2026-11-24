import { ExecutionContext } from '@nestjs/common';

/** Per-route limits (requests per minute); populated from configuration at application start. */
export const rateLimits = { global: 600, login: 60, refresh: 60, forgotPassword: 10, setup: 30 };

export const RATE_TTL_MS = 60_000;

type Key = keyof typeof rateLimits;
export const limitFor =
  (key: Key) =>
  (_ctx: ExecutionContext): number =>
    rateLimits[key];

export function configureRateLimits(values: typeof rateLimits): void {
  Object.assign(rateLimits, values);
}
