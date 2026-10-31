# Tracura: Universal API Telemetry & Observability Engine

**Tracura** is an enterprise-grade, high-throughput API observability, secret-scrubbing, and request telemetry engine. It functions both as an **in-process telemetry provider** for the host Innostes ERP and as a **universal standalone telemetry sink** for external microservices, AI/LLM proxies, mobile gateways, and third-party webhooks.

---

## Key Capabilities

1. **Dual-Ingestion Architecture**:
   - **In-Process ASGI Middleware**: Automatically captures internal ERP request timings, paths, headers, and status codes in `<0.002ms` without loopback HTTP calls or database locks.
   - **Remote Polyglot Ingestion**: Accepts batch or single telemetry logs from external services (Node.js, Go, Python, cURL, Java) authenticated via scoped API Keys (`X-API-Key: inno_log_live_...`).

2. **Deterministic Enterprise Scoping & Fallback Ladder**:
   - Automatically scopes host ERP requests under **Project: "Innostes ERP"** (`uuid5(tenant_id, "project:innostes-erp")`).
   - Automatically maps **Environment** from `APP_ENV` (`development`, `staging`, `production`) or headers.
   - Auto-provisions the Project and its environment badges (`Production`, `Staging`, `Development`) in the database upon first tenant access.
   - Supports explicit `X-Project-ID`, `X-Environment-ID`, and `X-Environment` gateway header overrides.

3. **Hybrid Queue Buffer (Redis + In-Memory Fallback)**:
   - **Redis Mode (`REDIS_URL`)**: Pushes logs to a centralized Redis queue (`tracura:logs:queue`) and publishes to `tracura:logs:live` for real-time WebSocket tailing.
   - **Automatic Fallback Mode**: If Redis is not configured or temporarily unreachable, Tracura automatically switches to an in-memory asynchronous ring buffer (`asyncio.Queue`) with zero dropped logs and zero downtime.

4. **Multi-Vector PII & Secret Scrubbing**:
   - Redacts sensitive headers (`Authorization`, `Cookie`, `X-API-Key`, `Set-Cookie`).
   - Deep recursive JSON masking (`password`, `secret`, `token`, `credit_card`, `ssn`, `access_token`).
   - Zero-masks client IPv4/IPv6 addresses for GDPR compliance.
   - Truncates oversized payloads (`max_body_size_bytes`).

5. **Cross-Referenced Compliance Tracing**:
   - Generates and propagates `X-Correlation-ID` across every HTTP interaction.
   - Directly linked with the **Kernel Audit Trail** (`kernel.audit`), enabling 1-click navigation between operational telemetry and compliance mutations.

---

## In-Process Architecture (Host ERP)

When running inside the Innostes ERP monolith, Tracura avoids network hops and database locks during user transactions:

```
FastAPI Request ---> TracuraCaptureMiddleware ---> asyncio.Queue / Redis (0.002ms)
                           |
                           v (Immediate Response with X-Correlation-ID)
             [Background Flusher Worker Task]
                           |
            (Every 1.0s or 100 accumulated logs)
                           v
              SanitizerService (Scrub PII & Secrets)
                           v
        PostgreSQL api_logs (Single Bulk SQL Insert)
```

### In-Process Usage Example

```python
from tracura.middleware.buffer import log_buffer

# Programmatically enqueue an outbound or background event in-memory:
await log_buffer.enqueue({
    "tenant_id": current_tenant_id,
    "project_id": project_id,
    "environment_id": environment_id,
    "http_method": "POST",
    "path": "/api/v1/payments/charge",
    "status_code": 200,
    "duration_ms": 142.5,
    "meta": {"provider": "stripe", "charge_id": "ch_123"},
})
```

---

## External Polyglot Ingestion (Microservices & Stacks)

External stacks ingest telemetry over HTTP using Google developer-style scoped API keys.

### cURL
```bash
curl -X POST "https://api.yourdomain.com/tracura/v1/ingest" \
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "method": "POST",
    "endpoint": "/api/v1/orders",
    "status_code": 200,
    "duration_ms": 142.5,
    "request_headers": {"content-type": "application/json"},
    "response_body": {"status": "success", "order_id": "ord_9901"}
  }'
```

### Node.js / Express Middleware
```javascript
const TRACURA_URL = process.env.TRACURA_URL || 'https://api.yourdomain.com/tracura/v1/ingest';
const TRACURA_KEY = process.env.TRACURA_API_KEY;

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    fetch(TRACURA_URL, {
      method: 'POST',
      headers: { 'X-API-Key': TRACURA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: req.method,
        endpoint: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: Date.now() - start
      })
    }).catch(console.error);
  });
  next();
});
```

---

## Environment Variables & Configuration

| Variable | Default | Description |
| :--- | :--- | :--- |
| `REDIS_URL` / `TRACURA_REDIS_URL` | *None* | Redis connection URI (e.g., `redis://localhost:6379/0`). If unset or unreachable, falls back to in-memory buffer. |
| `TRACURA_REDIS_QUEUE_KEY` | `tracura:logs:queue` | Redis List key used for buffering log entries before DB flush. |
| `TRACURA_REDIS_STREAM_CHANNEL` | `tracura:logs:live` | Redis Pub/Sub channel for live log tail streaming. |
| `APP_ENV` | `development` | Active deployment stage. Dynamically maps Tracura environment ID. |

---

## REST Endpoints Overview

| Category | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Ingestion** | `POST` | `/tracura/v1/ingest` | High-throughput asynchronous single log ingestion |
| **Ingestion** | `POST` | `/tracura/v1/ingest/batch` | Bulk log ingestion (up to 250 records per call) |
| **Projects** | `GET` | `/plugins/tracura/v1/projects` | List projects and environments for tenant (auto-provisions ERP defaults) |
| **Projects** | `POST` | `/plugins/tracura/v1/projects` | Create custom project with auto-seeded environments |
| **Projects** | `DELETE` | `/plugins/tracura/v1/projects/{id}` | Delete project and cascading telemetry |
| **Keys** | `GET` | `/plugins/tracura/v1/keys` | List scoped ingestion API keys |
| **Keys** | `POST` | `/plugins/tracura/v1/keys` | Generate new scoped ingestion API key |
| **Keys** | `DELETE` | `/plugins/tracura/v1/keys/{id}` | Revoke ingestion API key |
| **Settings** | `GET` | `/plugins/tracura/v1/settings` | Get effective retention & scrubbing policy |
| **Settings** | `PATCH` | `/plugins/tracura/v1/settings` | Update retention, sampling, or PII scrubbing |
| **Logs** | `GET` | `/plugins/tracura/v1/logs` | Query, filter, and search telemetry logs |
| **Logs** | `GET` | `/plugins/tracura/v1/logs/{id}` | Inspect full request and response payload drawer |
| **Analytics** | `GET` | `/plugins/tracura/v1/analytics/dashboard` | Dashboard KPIs, timeseries, and status codes |
| **Info** | `GET` | `/plugins/tracura/info` | Public plugin status, version, and feature capabilities |
