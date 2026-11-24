import { Injectable } from '@nestjs/common';
import { DatabaseUnavailableError } from '../common/errors';
import { DatabaseService } from '../db/database.service';

const CHECK_TIMEOUT_MS = 3000;

/**
 * Process-wide cache of "is the system installed?". Once true it is cached forever; "not installed" is re-checked
 * at most every `recheckMs` so other workers notice an install performed elsewhere.
 */
@Injectable()
export class InstallStateService {
  private installed = false;
  private checkedAt: number | null = null;
  recheckMs = 2000;

  constructor(private readonly db: DatabaseService) {}

  /** @throws DatabaseUnavailableError when the database cannot be queried (never reported as "not installed"). */
  async isInstalled(): Promise<boolean> {
    if (this.installed) return true;
    const now = Date.now();
    if (this.checkedAt !== null && now - this.checkedAt < this.recheckMs) return false;
    try {
      this.installed = await this.withTimeout(this.installationExists());
    } catch {
      throw new DatabaseUnavailableError();
    }
    this.checkedAt = now;
    return this.installed;
  }

  markInstalled(): void {
    this.installed = true;
  }

  reset(): void {
    this.installed = false;
    this.checkedAt = null;
  }

  async installationExists(): Promise<boolean> {
    const t = await this.db.query<{ ok: boolean }>("SELECT to_regclass('public.installation') IS NOT NULL AS ok");
    if (!t.rows[0].ok) return false;
    const r = await this.db.query<{ ok: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM installation WHERE singleton IS TRUE) AS ok',
    );
    return r.rows[0].ok;
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
  }
}
