import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { safeEqual } from '../crypto/cipher';
import { APP_CONFIG, AppConfig } from '../config/env';

/**
 * The one-time setup token protecting the web setup wizard: `SETUP_TOKEN` if configured, otherwise a random token
 * generated once into `SETUP_TOKEN_FILE` (mode 0600) and discarded after installation.
 */
@Injectable()
export class SetupTokenService {
  private readonly logger = new Logger(SetupTokenService.name);
  private readonly failures = new Map<string, number[]>();
  readonly maxAttempts = 10;
  /** Failures tolerated across ALL clients per window (bounds guessing when client IPs can be rotated/spoofed). */
  readonly maxGlobalAttempts = 100;
  /** Upper bound of tracked clients so an address-rotating attacker cannot grow the map without limit. */
  readonly maxTrackedClients = 10_000;
  readonly windowMs = 15 * 60 * 1000;
  private readonly GLOBAL = '*';

  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  private file(): string {
    return resolve(this.cfg.setup.tokenFile);
  }

  /** Returns the current token, generating (and storing) one when none is configured. */
  getToken(): { value: string; fromEnv: boolean } {
    if (this.cfg.setup.token) return { value: this.cfg.setup.token, fromEnv: true };
    const path = this.file();
    if (existsSync(path)) {
      const v = readFileSync(path, 'utf8').trim();
      if (v) return { value: v, fromEnv: false };
    }
    mkdirSync(dirname(path), { recursive: true });
    const value = randomBytes(32).toString('base64url');
    try {
      const fd = openSync(path, 'wx', 0o600); // O_EXCL: another worker may have won the race
      writeSync(fd, value);
      closeSync(fd);
    } catch {
      return { value: readFileSync(path, 'utf8').trim(), fromEnv: false };
    }
    return { value, fromEnv: false };
  }

  /** Logs a freshly generated token at startup (never a token supplied via SETUP_TOKEN). */
  announce(): void {
    const t = this.getToken();
    if (!t.fromEnv) this.logger.warn(`First-run setup token (also stored in ${this.file()}): ${t.value}`);
  }

  verify(candidate: string | undefined): boolean {
    if (!candidate) return false;
    return safeEqual(candidate, this.getToken().value);
  }

  discard(): void {
    try {
      unlinkSync(this.file());
    } catch {
      /* nothing generated */
    }
  }

  private recent(client: string, now: number): number[] {
    const list = (this.failures.get(client) ?? []).filter((t) => now - t < this.windowMs);
    this.failures.set(client, list);
    return list;
  }

  /** Seconds the client must wait, or null if it may try now. */
  retryAfter(client: string): number | null {
    const now = Date.now();
    for (const [key, max] of [
      [client, this.maxAttempts],
      [this.GLOBAL, this.maxGlobalAttempts],
    ] as const) {
      const list = this.recent(key, now);
      if (list.length >= max) return Math.max(1, Math.ceil((this.windowMs - (now - list[0])) / 1000));
    }
    return null;
  }

  recordFailure(client: string): void {
    const now = Date.now();
    this.recent(client, now).push(now);
    this.recent(this.GLOBAL, now).push(now);
    if (this.failures.size > this.maxTrackedClients) {
      for (const key of this.failures.keys()) {
        if (key !== this.GLOBAL && !this.recent(key, now).length) this.failures.delete(key);
        if (this.failures.size <= this.maxTrackedClients) break;
      }
      // Still too many live entries: drop the oldest tracked clients (their failures still count globally).
      for (const key of this.failures.keys()) {
        if (this.failures.size <= this.maxTrackedClients) break;
        if (key !== this.GLOBAL) this.failures.delete(key);
      }
    }
  }

  reset(client?: string): void {
    if (client) this.failures.delete(client);
    else this.failures.clear();
  }
}
