import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';

@Injectable()
export class MetricsService {
  private readonly started = Date.now();
  private readonly counts = new Map<string, number>();
  private durationSum = 0;
  private durationCount = 0;

  constructor(private readonly db: DatabaseService) {}

  observe(method: string, status: number, seconds: number): void {
    const key = `${method}|${Math.floor(status / 100)}xx`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
    this.durationSum += seconds;
    this.durationCount += 1;
  }

  render(): string {
    const lines: string[] = [
      '# HELP http_requests_total Total HTTP requests by method and status class.',
      '# TYPE http_requests_total counter',
    ];
    for (const [key, n] of [...this.counts.entries()].sort()) {
      const [method, cls] = key.split('|');
      lines.push(`http_requests_total{method="${method}",status="${cls}"} ${n}`);
    }
    lines.push(
      '# HELP http_request_duration_seconds_sum Total time spent serving requests.',
      '# TYPE http_request_duration_seconds_sum counter',
      `http_request_duration_seconds_sum ${this.durationSum.toFixed(6)}`,
      `http_request_duration_seconds_count ${this.durationCount}`,
      '# HELP process_uptime_seconds Process uptime.',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${((Date.now() - this.started) / 1000).toFixed(0)}`,
      '# HELP db_pool_connections PostgreSQL pool connections.',
      '# TYPE db_pool_connections gauge',
      `db_pool_connections{state="total"} ${this.db.pool.totalCount}`,
      `db_pool_connections{state="idle"} ${this.db.pool.idleCount}`,
      `db_pool_connections{state="waiting"} ${this.db.pool.waitingCount}`,
      '',
    );
    return lines.join('\n');
  }
}
