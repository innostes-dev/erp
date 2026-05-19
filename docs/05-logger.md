# Logger Service (`@innostes/core/logger`)

A loosely-coupled, transport-agnostic API logger for the Innostes Business OS.
All HTTP request/response cycles are captured automatically via middleware and fanned out
to one or more **transports** (file, console, external HTTP, etc.) without ever blocking the
request lifecycle.

---

## Architecture

```
HTTP Request
    │
    ▼
ApiLoggerMiddleware          ← captures req + res, builds IApiLogData
    │
    ▼
ApiLoggerService.log()       ← enriches with appName, env, timestamp
    │
    ├──▶ ConsoleTransport    ← colorized dev output
    ├──▶ FileTransport       ← NDJSON to logs/api.log (with rotation)
    └──▶ HttpTransport       ← ships to external API (Loki, Datadog, …)
```

Each transport implements `ILogTransport` — swap, add, or remove transports
with zero changes to the service or middleware.

---

## How API Requests Are Logged Automatically

The `LoggerModule` registers `ApiLoggerMiddleware` globally for all routes (`*`).
Every request is automatically captured with:

| Field | Source |
|---|---|
| `method` | `req.method` |
| `url` | `req.url` |
| `statusCode` | `res.statusCode` after response |
| `duration` | `Date.now()` diff between req in and res out |
| `ip` | `x-forwarded-for` header or socket address |
| `tenantId` | `x-tenant-id` header |
| `requestId` | auto-generated CUID2 |
| `level` | `info` (2xx), `warn` (4xx), `error` (5xx) |
| `body` | sanitized (passwords/tokens redacted) |
| `response` | parsed JSON from response body |

**Sensitive fields are automatically redacted:**
- Headers: `authorization`, `cookie`, `x-api-key`
- Body fields: `password`, `adminPassword`, `token`, `secret`, `refreshToken`

---

## Setup

### 1. Register in your AppModule

```typescript
// apps/api-gateway/src/app/app.module.ts
import { LoggerModule, FileTransport, ConsoleTransport } from '@innostes/core/logger';

@Module({
  imports: [
    LoggerModule.register({
      transports: [
        new ConsoleTransport(),                     // dev-friendly colorized output
        new FileTransport({
          filePath: 'logs/api.log',                 // relative to process.cwd()
          maxFileSizeBytes: 10 * 1024 * 1024,       // rotate at 10 MB
          maxFiles: 5,                              // keep last 5 rotated files
          redactFields: ['headers'],                // strip headers from file
        }),
      ],
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

`LoggerModule` is declared `global: true` — no need to re-import it in feature modules.

### 2. Skip paths (optional)

Edit `libs/core/logger/src/lib/api-logger.middleware.ts`:

```typescript
const SKIP_PATHS = ['/health', '/favicon.ico', '/api/docs'];
```

Add any paths you never want logged.

---

## Calling the Logger Manually

Inject `ApiLoggerService` anywhere in your app:

```typescript
import { ApiLoggerService } from '@innostes/core/logger';

@Injectable()
export class SomeService {
  constructor(private readonly logger: ApiLoggerService) {}

  async doSomething(userId: string, tenantId: string) {
    // ── Shorthand helpers ──────────────────────────────────────────────────
    this.logger.info({
      message: 'Something happened',
      userId,
      tenantId,
      meta: { detail: 'any extra context' },
    });

    this.logger.warn({
      message: 'Something suspicious',
      userId,
      tenantId,
    });

    this.logger.error({
      message: 'Something broke',
      userId,
      tenantId,
      error: new Error('boom'),
    });

    // ── Full IApiLogData ───────────────────────────────────────────────────
    await this.logger.log({
      level: 'info',
      message: 'Manual audit event',
      method: 'POST',
      url: '/some/endpoint',
      statusCode: 200,
      userId,
      tenantId,
      requestId: 'trace-id-abc123',
      duration: 42,
      meta: { orderId: 'xyz' },
    });
  }
}
```

> **Note:** `info()`, `warn()`, `error()` are fire-and-forget (void).
> `log()` is async but you rarely need to await it since transports never block.

---

## Adding a New Transport

### Option A — External HTTP API (future)

```typescript
import { HttpTransport } from '@innostes/core/logger';

LoggerModule.register({
  transports: [
    new HttpTransport({
      url: 'https://your-log-ingestor.example.com/ingest',
      apiKey: process.env.LOG_API_KEY,
      timeoutMs: 2000,
    }),
  ],
})
```

### Option B — Custom Transport (e.g., database, Slack, etc.)

Implement `ILogTransport`:

```typescript
import { ILogTransport, IApiLogData } from '@innostes/core/logger';

export class SlackTransport implements ILogTransport {
  readonly name = 'SlackTransport';

  async write(data: IApiLogData): Promise<void> {
    // Only send errors to Slack
    if (data.level !== 'error') return;

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *${data.statusCode}* \`${data.method} ${data.url}\` — ${data.message}`,
      }),
    }).catch(() => {}); // never throw
  }
}
```

Then register it alongside others:

```typescript
LoggerModule.register({
  transports: [
    new ConsoleTransport(),
    new FileTransport({ filePath: 'logs/api.log' }),
    new SlackTransport(),   // ← drop in with no other changes needed
  ],
})
```

---

## Log File Format

Logs are written as **Newline-Delimited JSON (NDJSON)** — one JSON object per line:

```json
{"level":"info","timestamp":"2026-05-14T13:43:51.806Z","appName":"innostes-os","environment":"development","message":"POST /api/v1/auth/login 200","method":"POST","url":"/api/v1/auth/login","statusCode":200,"requestId":"kdzyl05...","ip":"127.0.0.1","tenantId":"system-tenant","duration":312,"headers":"[REDACTED]","query":{},"body":{"email":"admin@example.com","password":"[REDACTED]"},"response":{"success":true}}
{"level":"error","timestamp":"2026-05-14T13:44:54.793Z","appName":"innostes-os","environment":"development","message":"POST /api/v1/auth/setup 500","statusCode":500,"duration":127}
```

Parse with `jq` for human-readable output:
```bash
cat logs/api.log | jq .
# Filter only errors:
cat logs/api.log | jq 'select(.level == "error")'
```

---

## Log Rotation

`FileTransport` automatically rotates logs:

```
logs/api.log        ← current (active writes)
logs/api.log.1      ← previous (most recent rotation)
logs/api.log.2
logs/api.log.3
logs/api.log.4
logs/api.log.5      ← oldest (deleted when maxFiles exceeded)
```

Rotation triggers when `api.log` exceeds `maxFileSizeBytes` (default: 10 MB).

---

## IApiLogData Reference

| Field | Type | Description |
|---|---|---|
| `level` | `'info' \| 'warn' \| 'error'` | Severity |
| `message` | `string` | Human-readable summary |
| `appName` | `string?` | Auto-set from `APP_NAME` env var |
| `environment` | `string?` | Auto-set from `NODE_ENV` env var |
| `method` | `string?` | HTTP method |
| `url` | `string?` | Request path |
| `statusCode` | `number?` | HTTP status code |
| `userId` | `string?` | Authenticated user |
| `tenantId` | `string?` | Tenant context |
| `requestId` | `string?` | Unique trace ID per request |
| `ip` | `string?` | Client IP |
| `duration` | `number?` | Request time in ms |
| `headers` | `Record<string,unknown>?` | Request headers (auto-redacted) |
| `query` | `Record<string,unknown>?` | Query parameters |
| `body` | `unknown?` | Request body (sanitized) |
| `response` | `unknown?` | Response body |
| `error` | `any?` | Error object if applicable |
| `meta` | `Record<string,unknown>?` | Any custom metadata |
| `deviceFingerprint` | `string?` | Device tracking |
| `timestamp` | `string?` | ISO 8601 (auto-set if omitted) |
