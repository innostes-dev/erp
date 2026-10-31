# Tracura: Universal Open-Source API Telemetry & Observability Engine

> **Brand**: `Tracura`  
> **Package**: `plugins/tracura`  
> **Status**: Universal Telemetry Specification  
> **Target Scope**: Any application stack (Fintech, SaaS, AI/LLM Proxies, E-Commerce, IoT, Microservices, Mobile Backends, Webhooks)  
> **Compatibility**: OpenTelemetry / W3C TraceContext standards  
> **Last Updated**: 2026-10-31  

---

## 1. Executive Summary & Vision

**Tracura** is a domain-agnostic, enterprise-grade open-source API observability and telemetry engine. It is built to serve as a **single central telemetry sink for any software product or microservice across the entire company**.

Whether logging:
* An **AI/LLM proxy** (tracking token latencies, model calls, and streaming chunks),
* A **Fintech payment gateway** (tracking idempotency keys, bank webhooks, and raw signature headers),
* An **E-Commerce / SaaS backend** (tracking database query bottlenecks, tenant workspaces, and slow routes),
* A **Mobile backend** (tracking client device models, geographic IPs, and connectivity drops),
* Or an **outbound microservice** calling external third-party partner APIs (Stripe, Twilio, SendGrid, AWS).

The schema and ingestion pipeline provide complete, uniform visibility with zero coupling to any specific business domain.

```mermaid
flowchart TD
    subgraph AnyCompanyProduct ["Any Product, Stack, or Architecture across the Organization"]
        AI["AI / LLM Gateway<br/>(Python / FastAPI)"]
        Fintech["Payment Microservice<br/>(Go / gRPC / HTTP)"]
        SaaS["Multi-Tenant Web App<br/>(Node.js / React)"]
        Mobile["Mobile Apps & IoT<br/>(iOS / Android / Flutter)"]
        OutboundCalls["Outbound Partner Calls<br/>(Stripe, Twilio, Webhooks)"]
    end

    subgraph CentralIngestionGateway ["Universal Ingestion Gateway (External Surface)"]
        IngestEndpoint["POST /api-logger/v1/ingest<br/>(Single or Batch up to 250)"]
        AuthValidator["Google-Style Scoped Key Validator<br/>(Project & Environment Restrictions, IP Allowlists)"]
        SanitizationEngine["Multi-Vector PII & Secret Redactor<br/>(Headers, Query Params, JSON Trees, JWT Regex)"]
        AsyncRingBuffer["Non-Blocking Async Memory Buffer<br/>(Batch Accumulator)"]
    end

    subgraph HighThroughputStorage ["Storage & Life-Cycle Layer"]
        DB[("PostgreSQL api_logs<br/>(Immutable Append-Only<br/>Monthly Partitioned)")]
        RetentionEngine["Automated Retention Engine<br/>(Partition Drop / Archival)"]
    end

    subgraph InternalControlPlane ["Internal Management & Telemetry UI (Bearer JWT)"]
        Explorer["Universal Logs Explorer & Drawer Inspector"]
        Analytics["Latency (p50/p95/p99) & Error Diagnostics"]
        KeyManager["Ingestion Key Generator & Scopes"]
        PolicyConfig["Sampling, Retention & Secret Scrubbing Rules"]
    end

    AI -->|"X-API-Key"| IngestEndpoint
    Fintech -->|"X-API-Key"| IngestEndpoint
    SaaS -->|"X-API-Key"| IngestEndpoint
    Mobile -->|"X-API-Key"| IngestEndpoint
    OutboundCalls -->|"X-API-Key"| IngestEndpoint

    IngestEndpoint --> AuthValidator
    AuthValidator --> SanitizationEngine
    SanitizationEngine --> AsyncRingBuffer
    AsyncRingBuffer -->|"Bulk Flush (e.g. 2s / 500 rows)"| DB
    RetentionEngine --> DB

    DB --> Explorer
    DB --> Analytics
    KeyManager --> DB
    PolicyConfig --> DB
```

---

## 2. Universal Enterprise Hierarchy

The platform organizes telemetry using a hierarchical structure applicable to any software enterprise:

```
Organization (Tenant Root)
 └── Projects (e.g., "AI-Copilot", "Payment-Gateway", "Customer-Portal", "IoT-Ingestor")
      └── Environments (e.g., "production", "staging", "development", "sandbox", "edge")
           ├── Ingestion API Keys (Google-Developer style scoped keys)
           ├── Settings & Policies (Retention windows, sampling rate, PII rules)
           └── API Logs (Universal append-only request/response telemetry)
```

---

## 3. Universal Data Model

### 3.1 `api_log_projects`
Represents an individual codebase, service, application, or product.

```
┌─────────────────────────────────────────────────────────────────┐
│ api_log_projects                                                │
├──────────────────────┬──────────────────────────────────────────┤
│ id                   │ UUID PK (v4)                             │
│ tenant_id            │ UUID FK → tenants.id (Cascade)           │
│ name                 │ VARCHAR(255) NOT NULL (e.g. "Payment GW")│
│ slug                 │ VARCHAR(63) NOT NULL (e.g. "payment-gw") │
│ description          │ TEXT, nullable                           │
│ is_active            │ BOOLEAN DEFAULT true NOT NULL            │
│ created_at           │ TIMESTAMPTZ NOT NULL, server default     │
│ created_by           │ UUID, nullable                           │
│ updated_at           │ TIMESTAMPTZ NOT NULL                     │
│ updated_by           │ UUID, nullable                           │
└──────────────────────┴──────────────────────────────────────────┘
  UNIQUE(tenant_id, slug)
  INDEX(tenant_id, is_active)
```

### 3.2 `api_log_environments`
Deployment stages within a project (`production`, `staging`, `development`, `edge`, etc.).

```
┌─────────────────────────────────────────────────────────────────┐
│ api_log_environments                                            │
├──────────────────────┬──────────────────────────────────────────┤
│ id                   │ UUID PK (v4)                             │
│ project_id           │ UUID FK → api_log_projects.id (Cascade)  │
│ tenant_id            │ UUID FK → tenants.id                     │
│ name                 │ VARCHAR(64) NOT NULL (e.g., Production)  │
│ slug                 │ VARCHAR(32) NOT NULL (e.g., production)  │
│ color_badge          │ VARCHAR(16) DEFAULT 'blue'               │
│ is_active            │ BOOLEAN DEFAULT true NOT NULL            │
│ created_at           │ TIMESTAMPTZ NOT NULL, server default     │
│ updated_at           │ TIMESTAMPTZ NOT NULL                     │
└──────────────────────┴──────────────────────────────────────────┘
  UNIQUE(project_id, slug)
  INDEX(project_id, is_active)
```

### 3.3 `api_log_api_keys` (Google-Style Scoped Ingestion Keys)
High-entropy credentials used exclusively by application runtimes to push logs into the platform.

```
┌─────────────────────────────────────────────────────────────────┐
│ api_log_api_keys                                                │
├──────────────────────┬──────────────────────────────────────────┤
│ id                   │ UUID PK (v4)                             │
│ tenant_id            │ UUID FK → tenants.id                     │
│ name                 │ VARCHAR(128) NOT NULL (e.g. "Prod K8s")  │
│ key_prefix           │ VARCHAR(16) NOT NULL (e.g. inno_log_live)│
│ key_hash             │ VARCHAR(128) NOT NULL (HMAC SHA-256)     │
│ status               │ ENUM('active','revoked','expired')       │
│                      │                                          │
│ ── Target Scope Restrictions (Google Model) ────────────────────┤
│ project_id           │ UUID FK → api_log_projects.id, nullable  │
│                      │ (null = allowed across all tenant projs) │
│ allowed_environments │ JSONB NOT NULL DEFAULT '["*"]'           │
│                      │ e.g. ["production"], ["staging", "dev"]  │
│                      │                                          │
│ ── Network & Perimeter Restrictions ────────────────────────────┤
│ ip_allowlist         │ JSONB, nullable (e.g. ["10.0.0.0/16"])   │
│ allowed_origins      │ JSONB, nullable (e.g. ["*.domain.com"])  │
│                      │                                          │
│ ── Rate Limiting & Lifecycle ───────────────────────────────────┤
│ rate_limit_rpm       │ INTEGER DEFAULT 1200 NOT NULL            │
│ expires_at           │ TIMESTAMPTZ, nullable                    │
│ last_used_at         │ TIMESTAMPTZ, nullable                    │
│ created_at           │ TIMESTAMPTZ NOT NULL                     │
│ created_by           │ UUID, nullable                           │
└──────────────────────┴──────────────────────────────────────────┘
  INDEX(key_prefix)
  INDEX(tenant_id, status)
  INDEX(project_id)
```

### 3.4 `api_log_settings`
Configurable at Tenant level (defaults) and overridable per Project or Environment.

```
┌─────────────────────────────────────────────────────────────────┐
│ api_log_settings                                                │
├──────────────────────┬──────────────────────────────────────────┤
│ id                   │ UUID PK (v4)                             │
│ tenant_id            │ UUID FK → tenants.id                     │
│ project_id           │ UUID FK → api_log_projects.id, nullable  │
│ environment_id       │ UUID FK → api_log_environments.id, null  │
│                      │                                          │
│ ── Retention & Buffer ──────────────────────────────────────────┤
│ retention_days       │ INTEGER DEFAULT 30 NOT NULL              │
│ max_body_size_bytes  │ INTEGER DEFAULT 4096 NOT NULL (4KB)      │
│                      │                                          │
│ ── Ingestion Filters ───────────────────────────────────────────┤
│ sampling_rate        │ NUMERIC(3, 2) DEFAULT 1.00 NOT NULL      │
│ capture_headers      │ BOOLEAN DEFAULT true NOT NULL            │
│ capture_body         │ BOOLEAN DEFAULT true NOT NULL            │
│ log_errors_only      │ BOOLEAN DEFAULT false NOT NULL           │
│ excluded_paths       │ JSONB DEFAULT '["/health","/metrics"]'   │
│                      │                                          │
│ ── PII & Secret Scrubbing ──────────────────────────────────────┤
│ sensitive_headers    │ JSONB DEFAULT '["authorization","cookie",│
│                      │  "x-api-key","proxy-authorization"]'     │
│ sensitive_body_fields│ JSONB DEFAULT '["password","secret",     │
│                      │  "credit_card","token","cvv","ssn"]'     │
│ mask_client_ip       │ BOOLEAN DEFAULT false NOT NULL           │
│                      │                                          │
│ created_at           │ TIMESTAMPTZ NOT NULL                     │
│ updated_at           │ TIMESTAMPTZ NOT NULL                     │
└──────────────────────┴──────────────────────────────────────────┘
  UNIQUE(tenant_id, project_id, environment_id)
```

---

### 3.5 `api_logs` (Universal Telemetry Table)
The core immutable telemetry table (`UPDATED_AT = null`). Streamlined to a high-performance, universal core that any project can send in 10 lines of middleware code, with `meta` as the flexible escape hatch for any custom project data.

```
┌─────────────────────────────────────────────────────────────────┐
│ api_logs (Partitioned monthly by created_at)                    │
├──────────────────────┬──────────────────────────────────────────┤
│ id                   │ UUID PK (v4)                             │
│ tenant_id            │ UUID NOT NULL (Enforced Server-Side)     │
│ project_id           │ UUID NOT NULL                            │
│ environment_id       │ UUID NOT NULL                            │
│ api_key_id           │ UUID, nullable (Ingestion key used)      │
│                      │                                          │
│ ── Tracing & Identity ──────────────────────────────────────────┤
│ correlation_id       │ VARCHAR(64) NOT NULL (Request Trace ID)  │
│ user_id              │ VARCHAR(64), nullable (Authenticated ID) │
│ client_ip            │ VARCHAR(45), nullable (Masked if GDPR)   │
│ user_agent           │ VARCHAR(512), nullable (Client browser)  │
│                      │                                          │
│ ── HTTP Request & Response ─────────────────────────────────────┤
│ http_method          │ VARCHAR(10) NOT NULL (GET, POST, etc.)   │
│ url                  │ TEXT NOT NULL (Full requested URL)       │
│ path                 │ VARCHAR(2048) NOT NULL (Normalized path) │
│ status_code          │ SMALLINT NOT NULL (200, 404, 500, etc.)  │
│ duration_ms          │ DOUBLE PRECISION NOT NULL (Total Latency)│
│                      │                                          │
│ ── Payloads (Sanitized JSONB) ──────────────────────────────────┤
│ request_headers      │ JSONB, nullable (Redacted)               │
│ query_params         │ JSONB, nullable (Redacted)               │
│ request_body         │ JSONB, nullable (Redacted / Truncated)   │
│ response_headers     │ JSONB, nullable (Redacted)               │
│ response_body        │ JSONB, nullable (Redacted / Truncated)   │
│                      │                                          │
│ ── Diagnostics & Extensibility ─────────────────────────────────┤
│ error                │ JSONB, nullable (code, message, trace)   │
│ meta                 │ JSONB, nullable (Developer custom data:  │
│                      │  AI tokens, git commit, pod, Stripe ID)  │
│                      │                                          │
│ ── Immutable Time ──────────────────────────────────────────────┤
│ created_at           │ TIMESTAMPTZ NOT NULL, server default     │
└──────────────────────┴──────────────────────────────────────────┘
  PRIMARY KEY (id, created_at)
  INDEX(tenant_id, project_id, environment_id, created_at DESC)
  INDEX(correlation_id)
  INDEX(user_id)
  INDEX(tenant_id, status_code, created_at DESC)
  INDEX(tenant_id, duration_ms DESC)
```

#### Why `meta` (JSONB) is the Developer Escape Hatch
Any project can attach arbitrary custom metadata without schema migrations:
* **AI / LLM services**: `"meta": { "model": "gpt-4o", "prompt_tokens": 120, "completion_tokens": 45 }`
* **Fintech / Payments**: `"meta": { "idempotency_key": "idem_9921", "gateway": "stripe", "charge_id": "ch_4421" }`
* **E-Commerce**: `"meta": { "cart_id": "c_99124", "currency": "INR" }`
* **DevOps / Microservices**: `"meta": { "git_commit": "a8f9c11", "pod": "billing-app-79cb8", "db_queries": 4 }`

#### Standard Query Filters & Scopes
* **`for_correlation(correlation_id)`**: Traces full life-cycle of a request across services.
* **`for_user(user_id)`**: Inspects all API traffic generated by an actor.
* **`for_status(status_code)`**: Filters exact status codes (e.g., `401`, `504`).
* **`errors_only()`**: Filters error responses where `status_code >= 400`.
* **`slow_requests(threshold_ms = 1000.0)`**: Discovers latency bottlenecks where `duration_ms >= threshold_ms`.
* **`project_environment(project_id, environment_id)`**: Isolates telemetry to a specific deployment stage.

---

## 4. Ingestion Engine & Universal Payload Specification

### 4.1 Ingestion Endpoints
* `POST /api-logger/v1/ingest` (Single entry)
* `POST /api-logger/v1/ingest/batch` (Batch upload up to 250 entries)

### 4.2 Authentication & Verification
* Header: `X-API-Key: inno_log_live_********************`
* Strictly checks key hash, resolves `tenant_id`, enforces Project/Environment restrictions, checks IP allowlist, and returns `202 Accepted` within `< 5ms`.

### 4.3 Universal Ingestion Payload Example
```json
{
  "project": "payment-gateway",
  "environment": "production",
  "correlation_id": "req_88fbc09d12",
  "http_method": "POST",
  "url": "https://api.company.com/v1/payments/charges",
  "path": "/v1/payments/charges",
  "status_code": 200,
  "duration_ms": 138.45,
  "client_ip": "103.21.244.1",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)",
  "user_id": "cust_992144",
  "query_params": {
    "currency": "INR"
  },
  "request_headers": {
    "content-type": "application/json",
    "x-idempotency-key": "idem_tok_99182341"
  },
  "request_body": {
    "amount": 4500.0,
    "currency": "INR",
    "card_token": "tok_visa_4242"
  },
  "response_headers": {
    "content-type": "application/json"
  },
  "response_body": {
    "id": "ch_99214",
    "status": "succeeded"
  },
  "error": null,
  "meta": {
    "gateway": "stripe",
    "idempotency_key": "idem_tok_99182341",
    "cluster": "k8s-prod-ap-south",
    "git_commit": "a8f9c11"
  },
  "created_at": "2026-10-31T01:30:00.123Z"
}
```

---

## 5. Security & Privacy Guarantees

1. **Strict Operational Boundary**:
   * **Ingestion (`POST /v1/ingest`, `/batch`)**: Authenticated **strictly by Ingestion API Key** (`X-API-Key`). No user token required.
   * **All Other Endpoints (Management, Logs Explorer, Settings, Analytics)**: Accessible **strictly via User Auth (`Bearer JWT`)**. Ingestion keys cannot view logs or change configurations.
2. **Tenant Isolation Invariant**:
   * Ingestion payloads **never** specify or override `tenant_id`. It is strictly derived server-side from the authenticated API key record in the database.
3. **Multi-Vector Secret Redaction**:
   * Headers, sensitive query parameters (`token`, `secret`, `key`, `password`), JSON payload fields (`password`, `credit_card`, `token`, `cvv`), and raw JWT patterns are automatically sanitized before entering the buffer.
4. **Append-Only Immutability**:
   * `api_logs` has no `updated_at`. Application database role has `REVOKE UPDATE, DELETE ON api_logs`. Purges only occur via partition drops.
5. **GDPR / Privacy Compliance**:
   * Client IPs can be automatically zero-masked at ingestion.
   * Trace keys retain structure while replacing values with `[REDACTED]`.

---

## 6. Project Directory Structure

```
plugins/tracura/
├── backend/
│   └── tracura/
│       ├── __init__.py                  # TracuraPlugin & BaseModule lifecycle
│       ├── router/                      # Ingest, projects, keys, settings, logs, analytics
│       ├── middleware/                  # ASGI auto-capture & hybrid Redis/in-memory queue buffer
│       ├── auth/                        # User context & scoped API key verification
│       ├── models/                      # SQLAlchemy models
│       ├── schemas/                     # Pydantic validation models
│       └── services/                    # Sanitizer, Ingest, Projects, Keys, Analytics, Settings
│   ├── pyproject.toml                   # innostes-tracura Python package
│   └── tests/test_tracura.py            # Unit & integration test suite
└── frontend/
    ├── package.json                     # @innostes/tracura
    └── src/
        ├── TracuraPage.tsx              # Full dashboard, inspector, and settings UI
        ├── manifest.ts                  # Plugin manifest registration
        └── index.ts
│       │
│       ├── services/
│       │   ├── __init__.py
│       │   ├── project_service.py       # Projects & Environments business logic
│       │   ├── api_key_service.py       # Key generation, hashing & verification
│       │   ├── settings_service.py      # Hierarchy resolution (Tenant -> Project -> Env)
│       │   ├── ingest_service.py        # Validation, PII scrubbing, batch enqueue
│       │   ├── log_query_service.py     # Filtered search, pagination, inspector
│       │   ├── analytics_service.py     # Aggregations, p95 latency, timeseries
│       │   └── retention_service.py     # Partition cleanup & purge runner
│       │
│       ├── middleware/
│       │   ├── __init__.py
│       │   ├── capture.py               # Universal ASGI auto-capture middleware
│       │   └── buffer.py                # Asynchronous queue & batch DB flush worker
│       │
│       ├── auth/
│       │   ├── __init__.py
│       │   └── ingest_auth.py           # X-API-Key validator dependency
│       │
│       └── router/
│           ├── __init__.py
│           ├── ingest.py                # POST /v1/ingest (Single & Batch)
│           ├── projects.py              # Projects & Environments endpoints
│           ├── keys.py                  # API Key management endpoints
│           ├── settings.py              # Settings & Policies endpoints
│           ├── logs.py                  # Log Explorer endpoints
│           └── analytics.py             # Telemetry & charts endpoints
│
├── frontend/                            # Standalone UI package (@innostes/api-logger)
│   ├── src/
│   │   ├── TracuraPage.tsx              # Full UI (Explorer, Keys, Metrics, Settings)
│   │   ├── manifest.ts                  # Subfeature definitions
│   │   └── index.ts                     # Package exports
│   └── package.json
│
├── alembic/
│   └── versions/                        # Migration scripts for logger tables
│
├── ARCHITECTURE.md
└── README.md
```

---

## 7. Frontend Architecture & Implementation Flow

### 7.1 Frontend Architecture Overview & Design System Foundation

The frontend for the API Logger plugin is implemented as a standalone package located at `plugins/api-logger/frontend` (`@innostes/api-logger`). It is integrated into the Innostes enterprise workspace using:
* **React 19 & TypeScript**: Strict typing for all telemetry models, filter parameters, and inspection states.
* **`@innostes/ui` Design System**: Enterprise UI components including `MetricCard`, `DataTable`, `Tabs`, `Sheet`, `Drawer`, `Dialog`, `Badge`, `Button`, `SearchInput`, and `EmptyState`.
* **Tailwind CSS (v4)**: Responsive layouts, semantic dark/light theme tokens, and color-coded status badges.
* **`lucide-react`**: Consistent visual iconographic hierarchy across HTTP methods, filters, and actions.

```mermaid
flowchart TD
    Shell["PluginShellLayout (apps/web-app)"] --> Check{"isPluginActive('api-logger')?"}
    Check -- "No (Inactive)" --> InactiveState["EmptyState: Activate Plugin CTA"]
    Check -- "Yes (Active)" --> ApiLoggerPage["ApiLoggerPage (@innostes/api-logger)"]

    ApiLoggerPage --> GlobalBar["Global Control & Context Header"]
    GlobalBar --> ProjectSelect["Project Context Selector (All / Specific)"]
    GlobalBar --> EnvSelect["Environment Context Selector (Prod / Staging / Dev)"]
    GlobalBar --> LivePolling["Live Polling Toggle (Paused / 5s / 15s / 30s)"]
    GlobalBar --> KeyModalTrigger["'Generate Ingestion Key' Action Modal"]

    ApiLoggerPage --> TabNav["Subfeature Tabs Navigation"]
    TabNav --> OverviewView["Tab 1: Overview & KPI Analytics"]
    TabNav --> ExplorerView["Tab 2: Request Logs Explorer"]
    TabNav --> KeysView["Tab 3: Ingestion Keys Manager"]
    TabNav --> SettingsView["Tab 4: Settings & Scrubbing Policies"]

    ExplorerView --> FilterBar["Multi-Vector Filter Bar"]
    FilterBar --> StatusPills["Status Filter Pills (All, 2xx, 3xx, 4xx, 5xx)"]
    FilterBar --> ErrorsOnly["'Errors Only' Toggle Pill"]
    FilterBar --> SlowToggle["'Slow (>1s)' Latency Toggle Pill"]
    FilterBar --> SearchBox["Search Input (Path, URL, Trace ID)"]

    ExplorerView --> LogsTable["Dense Telemetry Logs Table"]
    LogsTable -->|"Row Click"| Drawer["Slide-Out Inspector Drawer (Sheet)"]

    Drawer --> PayloadTab["Payloads (JSON Request & Response Bodies)"]
    Drawer --> HeadersTab["Headers (Sanitized HTTP Request & Response Headers)"]
    Drawer --> MetaTab["Metadata (Developer Escape Hatch JSONB)"]
    Drawer --> ErrorTab["Error Diagnostics (Exception Type & Stack Trace)"]
    Drawer --> CurlTab["cURL Replay Generator (Instant Reproduce)"]
```

---

### 7.2 Component Hierarchy & State Flow

The root component is [`TracuraPage.tsx`](file:///home/sai/Documents/GitHub/innostes_projects/erp/plugins/api-logger/frontend/src/TracuraPage.tsx). It encapsulates all telemetry states, filters, polling timers, and modal dialogs:

| State Variable | Type | Description |
| :--- | :--- | :--- |
| `activeTab` | `'overview' \| 'logs' \| 'keys' \| 'settings'` | Active top-level subfeature tab |
| `selectedProject` | `string` (`'all'` or project ID) | Scopes logs, metrics, and keys to a specific project |
| `selectedEnv` | `string` (`'all'`, `'production'`, `'staging'`, etc.) | Scopes logs and telemetry to a deployment environment |
| `searchQuery` | `string` | Search filter matching URL, path, or trace correlation ID |
| `statusFilter` | `'all' \| '2xx' \| '3xx' \| '4xx' \| '5xx'` | HTTP status code category filter |
| `errorsOnly` | `boolean` | Quick toggle filtering only HTTP responses >= 400 |
| `slowOnly` | `boolean` | Quick toggle filtering slow requests with duration >= 1,000ms |
| `selectedLog` | `ApiLogItem \| null` | Currently inspected log driving the Slide-Out Drawer |
| `isKeyModalOpen` | `boolean` | Controls visibility of Ingestion Key Generator modal |
| `createdKeySecret` | `string \| null` | Temporary state holding plaintext key secret for one-time display |
| `pollInterval` | `number \| null` | Auto-refresh cadence (5000ms, 15000ms, 30000ms, or null for paused) |

---

### 7.3 Detailed Subfeature UI Breakdown

#### 7.3.1 Telemetry Overview & Real-Time KPIs
Located under the **Overview** tab:
* **Metric Cards**:
  1. *Total Ingested Requests*: Cumulative request count with trend indicator.
  2. *Error Rate %*: Colored dynamically (emerald `< 1%`, amber `1-5%`, rose `> 5%`).
  3. *Average Latency*: System-wide mean response time in milliseconds.
  4. *P95 / P99 Latency*: Tail latency metrics detecting sluggish microservices.
* **Status Code Distribution Bar**: Visual proportion bar breaking down 2xx (Success), 3xx (Redirect), 4xx (Client Errors), and 5xx (Server Failures).
* **Latency Percentile Matrix**: Highlights fast routes vs routes requiring optimization.

#### 7.3.2 Request Logs Explorer & Multi-Vector Filters
Located under the **Request Logs** tab:
* **Filter Bar**:
  - Search box with instantaneous matching across path, full URL, and correlation ID.
  - Quick filter pills for method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
  - Status code category pills (`All`, `2xx Success`, `3xx Redirect`, `4xx Client Error`, `5xx Server Error`).
  - Toggle switch for **Errors Only** (`status_code >= 400`).
  - Toggle switch for **Slow Requests** (`duration_ms >= 1000ms`).
* **Dense Data Table**:
  - Columns: `HTTP Method`, `Status Code Badge`, `Path & Full URL`, `Latency (ms)`, `Client IP`, `Correlation ID`, `Timestamp`.
  - Visual color badges: `GET` (Blue), `POST` (Emerald), `PUT`/`PATCH` (Amber), `DELETE` (Rose).
  - Hover highlight and click-to-open Slide-Out Inspector Drawer.

#### 7.3.3 Slide-Out Inspector Drawer (Slide-Over Sheet)
Triggered upon selecting any row in the Logs Explorer table:
* **Drawer Header**: Displays HTTP method badge, status code badge, full route path, latency duration, and exact UTC timestamp.
* **Inspector Sub-Tabs**:
  1. **Payloads Tab**:
     - Formatted JSON Request Body and Response Body.
     - Syntax color-coded, expandable trees with word-wrap and one-click copy to clipboard.
     - Automatically indicates truncated payloads if original size exceeded policy threshold.
  2. **Headers Tab**:
     - Key-value tables of Request Headers and Response Headers.
     - Sensitive credentials (e.g., `authorization`, `cookie`, `x-api-key`) display sanitized `[REDACTED]` values.
  3. **Metadata (`meta`) Tab — The Developer Escape Hatch**:
     - Dedicated JSON inspector rendering project-specific metadata (e.g., AI model tokens, Stripe charge IDs, git commit hashes, Kubernetes pods).
  4. **Error Diagnostics Tab**:
     - Visible only when `error` payload exists or `status_code >= 400`.
     - Displays error code, message, exception class, and structured stack trace for instant debugging.
  5. **Executable cURL Replay Generator**:
     - Automatically generates a copyable, executable cURL command matching the exact request method, URL, headers, and body payload.

#### 7.3.4 Ingestion Keys Management
Located under the **Ingestion Keys** tab:
* **Active Keys Table**:
  - Columns: `Key Name`, `Prefix (inno_log_live_...)`, `Status (Active / Revoked)`, `Target Project Scope`, `Allowed Environments`, `Rate Limit (RPM)`, `Last Used`, `Created At`, and `Revoke Action`.
* **"Generate Ingestion Key" Modal Dialog**:
  - Input for key label/name.
  - Project scope dropdown (locked to specific project or tenant-wide).
  - Environment scope checkboxes (`production`, `staging`, `development`, or all `*`).
  - CIDR/IP allowlist input (e.g., `10.0.0.0/16, 192.168.1.1`).
  - Rate limit requests per minute slider (60 to 120,000 RPM).
* **One-Time Secret Reveal Banner**:
  - Displays raw high-entropy secret (`inno_log_live_...`) with warning that it is never retrievable again.
  - One-click copy button and a pre-filled cURL test command.

#### 7.3.5 Settings & Governance Policies
Located under the **Settings & Policies** tab:
* **Retention Window**: Configurable slider from 7 to 730 days (default: 30 days).
* **Max Payload Body Size**: Slider from 512 bytes to 64 KB (default: 4 KB) preventing memory exhaustion.
* **Sampling Rate**: Slider from 1% to 100% (default: 100%) for high-volume ingress control.
* **Path Exclusion List**: Tag input defining routes to bypass logging (e.g. `/health`, `/metrics`, `/favicon.ico`).
* **Multi-Vector PII & Secret Redaction**:
  - Sensitive header tag input (`authorization`, `cookie`, `x-api-key`, `proxy-authorization`).
  - Sensitive JSON body field tag input (`password`, `secret`, `credit_card`, `token`, `cvv`, `ssn`).
* **GDPR Client IP Zero-Masking**: Toggle to truncate last octet of IPv4 and last 64 bits of IPv6 addresses at ingestion.

---

## 8. Main Application Activation & Integration Flow

The API Logger plugin is built as an extensible modular plugin that integrates into the Innostes ERP host application (`apps/web-app`) through standard discovery, tenant activation, and dynamic shell rendering.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Tenant Administrator
    participant UI as Web App (PluginsManagerPage)
    participant Ctx as PluginsContext (React Context)
    participant Storage as LocalStorage (innostes_active_plugins)
    participant API as Kernel Backend (/tenants/current/plugins)
    participant Shell as PluginShellLayout (/plugins/api-logger)

    Admin->>UI: Navigate to "/plugins"
    UI->>Ctx: Read activePluginIds
    Ctx->>API: GET /tenants/current/plugins (Bearer JWT)
    API-->>Ctx: [{ id: "api-logger", is_active: false }]
    Ctx-->>UI: Display API Logger Card in Catalog (Inactive State)

    Admin->>UI: Click "Activate API Logger"
    UI->>Ctx: activatePlugin("api-logger")
    Ctx->>Storage: Optimistically persist ["api-logger"] in localStorage
    Ctx->>API: POST /tenants/current/plugins/api-logger/activate
    API-->>Ctx: 200 OK (tenant_plugins updated in database)
    UI-->>Admin: Plugin shows "Active", Sidebar badge incremented

    Admin->>Shell: Navigate to "/plugins/api-logger"
    Shell->>Ctx: isPluginActive("api-logger")
    Ctx-->>Shell: true
    Shell->>Shell: Mount <ApiLoggerPage />
    Shell-->>Admin: Full Telemetry Dashboard & Logs Explorer rendered
```

### 8.1 Discovery & Manifest Registration
1. The frontend plugin declares its metadata, subfeatures, and routing path in [`manifest.ts`](file:///home/sai/Documents/GitHub/innostes_projects/erp/plugins/api-logger/frontend/src/manifest.ts):
   ```typescript
   export const apiLoggerManifest: PluginManifest = {
     id: 'api-logger',
     name: 'API Logger',
     version: '0.1.0',
     description: 'Enterprise API logging, telemetry, and distributed request inspection',
     type: 'plugin',
     tags: ['Logs', 'Telemetry', 'Analytics', 'Enterprise'],
     tone: 'chart-5',
     href: '/plugins/api-logger',
     subFeatures: [
       { id: 'overview', label: 'Overview', description: 'Real-time telemetry, error rates, and request latency KPIs.' },
       { id: 'logs', label: 'Request Logs', description: 'Live HTTP request/response payloads, headers, and trace inspection.' },
       { id: 'keys', label: 'Ingestion Keys', description: 'Manage Google-style scoped ingestion API keys and IP allowlists.' },
       { id: 'settings', label: 'Settings & Policies', description: 'Retention policies, sampling rate, and sensitive field scrubbers.' },
     ],
   };
   ```
2. The host application imports the manifest in [`apps/web-app/src/app/catalog.ts`](file:///home/sai/Documents/GitHub/innostes_projects/erp/apps/web-app/src/app/catalog.ts):
   ```typescript
   import { apiLoggerManifest } from '@innostes/api-logger';
   export const PLUGINS_CATALOG: CatalogItem[] = [ apiLoggerManifest ];
   ```

### 8.2 Tenant Plugin State & Activation Engine
* **State Management**: Managed via [`PluginsContext.tsx`](file:///home/sai/Documents/GitHub/innostes_projects/erp/apps/web-app/src/app/context/PluginsContext.tsx).
* **Tenant Isolation**: Each organization tenant has independent plugin activations recorded in the kernel `tenant_plugins` database table.
* **Activation API**:
  - `GET /tenants/current/plugins`: Returns all active plugins for the calling user's tenant.
  - `POST /tenants/current/plugins/api-logger/activate`: Activates the plugin for the tenant.
  - `POST /tenants/current/plugins/api-logger/deactivate`: Deactivates the plugin for the tenant.
* **Optimistic Local Caching**: Active IDs are synchronized to `localStorage['innostes_active_plugins']` for instant zero-flicker rendering upon browser refresh.

### 8.3 Main Application Shell Integration
* **Routing**: In [`apps/web-app/src/app/app.tsx`](file:///home/sai/Documents/GitHub/innostes_projects/erp/apps/web-app/src/app/app.tsx):
  ```tsx
  if (path.startsWith('/plugins/')) {
    const pluginId = path.replace('/plugins/', '').split('/')[0];
    if (pluginId) {
      return <PluginShellLayout pluginId={pluginId} />;
    }
  }
  ```
* **Activation Guard**: In [`PluginShellLayout.tsx`](file:///home/sai/Documents/GitHub/innostes_projects/erp/apps/web-app/src/app/components/PluginShellLayout.tsx):
  - If `isPluginActive('api-logger') === false`: Renders an enterprise `<EmptyState>` with a direct "Activate API Logger" action button.
  - If `isPluginActive('api-logger') === true`: Renders the full `<ApiLoggerPage />`.

### 8.4 Sidebar Navigation & App Switcher
* **Sidebar Menu**: [`SidebarNav.tsx`](file:///home/sai/Documents/GitHub/innostes_projects/erp/apps/web-app/src/app/components/SidebarNav.tsx) displays the "Plugins" menu button with an active badge counter reflecting total enabled plugins.
* **App Switcher**: The dedicated TopBar in `PluginShellLayout.tsx` provides a dropdown switcher to toggle between active plugins and modules without losing context.

---

## 9. End-to-End System Telemetry Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor ExtApp as Any Microservice / Stack
    actor Admin as Developer / Administrator
    participant Gateway as Ingestion Gateway (/api-logger/v1/ingest)
    participant Auth as Scoped Key Validator (ApiKeyService)
    participant Sanitizer as PII & Secret Redactor
    participant Buffer as Async Ring Buffer (LogBuffer)
    participant DB as PostgreSQL (api_logs)
    participant ControlPlane as Control Plane (/plugins/api-logger/v1/logs)
    participant UI as Observability UI (ApiLoggerPage)

    Note over Admin,DB: Phase 1: Ingestion Key Provisioning
    Admin->>UI: Open "Ingestion Keys" Tab -> Click "Generate Ingestion Key"
    UI->>ControlPlane: POST /plugins/api-logger/v1/keys (Bearer JWT)
    ControlPlane->>DB: INSERT into api_log_api_keys (Hash, Scopes, Rate Limits)
    ControlPlane-->>UI: Return inno_log_live_* Raw Secret
    UI-->>Admin: Display Key in One-Time Copy Dialog with cURL Code Snippet

    Note over ExtApp,DB: Phase 2: Asynchronous High-Throughput Ingestion (< 5ms)
    ExtApp->>Gateway: POST /api-logger/v1/ingest (Header: X-API-Key: inno_log_live_*)
    Gateway->>Auth: Validate key hash, check expiration, IP allowlist, and project/env scope
    Auth-->>Gateway: Key Validated (Tenant ID resolved server-side)
    Gateway->>Sanitizer: Scrub sensitive headers, query params, JWT patterns, JSON keys; mask IP
    Sanitizer-->>Gateway: Sanitized telemetry dictionary
    Gateway->>Buffer: enqueue(sanitized_log_dict)
    Gateway-->>ExtApp: 202 Accepted (Latency < 5ms)

    Note over Buffer,DB: Phase 3: Background Batch Persistence
    Buffer->>Buffer: Accumulate logs up to 100 rows or 1.0s interval
    Buffer->>DB: Bulk INSERT into api_logs
    DB-->>Buffer: Batch committed to disk

    Note over Admin,DB: Phase 4: Observability, Search & Inspector
    Admin->>UI: View "Request Logs" -> Toggle "Errors Only" or search route
    UI->>ControlPlane: GET /plugins/api-logger/v1/logs?errors_only=true (Bearer JWT)
    ControlPlane->>DB: SELECT * FROM api_logs WHERE tenant_id = :t AND status_code >= 400
    DB-->>ControlPlane: Return matching telemetry records
    ControlPlane-->>UI: Render rows in dense table
    Admin->>UI: Click on failed row
    UI->>UI: Open Slide-Out Drawer with Payloads, Headers, Meta, Errors & cURL replay
```

---

## 10. Production Readiness & Verification Checklist

| Layer | Component | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **Database** | Migration `0006_create_api_logger_tables.py` | Verified | All 5 tables created with compound indexes & foreign key cascades |
| **Database** | Immutability & Append-Only | Verified | `api_logs` has no `updated_at` / `deleted_at`; mutations strictly rejected |
| **Backend** | Models & Schemas | Verified | 15 core columns + `meta` JSONB; Pydantic request/response schemas |
| **Backend** | Ingestion Engine (`/v1/ingest`, `/batch`) | Verified | Accepts `X-API-Key` only; non-blocking enqueue to `LogBuffer` |
| **Backend** | Google-Style Scoping | Verified | Validates project restriction, allowed environments, and CIDR allowlist |
| **Backend** | Multi-Vector Secret Scrubbing | Verified | Redacts authorization, cookies, passwords, tokens, JWTs, and masks IP |
| **Backend** | Control Plane Endpoints | Verified | Projects, Keys, Settings, Logs Explorer, and Analytics Dashboard |
| **Backend** | Architectural Fitness (`pnpm arch-check`) | Verified | 5 contracts kept, 0 broken; zero kernel-to-plugin leakage |
| **Backend** | Unit & Integration Tests | Verified | 15/15 unit tests passing in 0.119s |
| **Frontend** | Manifest & Catalog Registration | Verified | `apiLoggerManifest` registered in `@innostes/api-logger` & `catalog.ts` |
| **Frontend** | Main Application Activation Gate | Verified | `PluginsContext` tenant state & `<EmptyState>` activation CTA |
| **Frontend** | Complete Observability UI | Verified | Overview KPIs, Logs Explorer, Slide-Out Drawer, Key Modal, Settings Form |
| **Frontend** | Production Bundle Build (`pnpm nx build web-app`) | Verified | Successfully built in 595ms |

---

## 11. Dual Ingestion & Hybrid Redis Queue Architecture

Tracura operates a unified telemetry funnel that serves both the internal host application and external microservices with optimal efficiency:

```mermaid
flowchart TD
    subgraph HostERP ["In-Process Host (Innostes ERP)"]
        Req["FastAPI Request"] --> Middleware["TracuraCaptureMiddleware<br/>(ASGI Hook)"]
        SvcCall["Internal Service Call<br/>(Stripe, Twilio, Webhook)"] --> SvcLog["Tracura Service Record"]
    end

    subgraph ExternalServices ["External Stacks & Microservices"]
        ExtApps["Polyglot Services<br/>(Node, Go, Python, cURL)"] --> HTTPGate["REST Ingest Route<br/>POST /api-logger/v1/ingest"]
        HTTPGate --> KeyVerify["X-API-Key Verification<br/>(IP Allowlist & Environment Scopes)"]
    end

    subgraph HybridQueue ["Hybrid Queue Buffer (LogBuffer)"]
        Middleware -->|Direct Enqueue <0.002ms| DriverSwitch{"Redis Available?"}
        SvcLog -->|Direct Enqueue| DriverSwitch
        KeyVerify -->|Async 202 Accepted| DriverSwitch

        DriverSwitch -->|REDIS_URL active| RedisList[("Redis Queue<br/>tracura:logs:queue<br/>+ Publish to tracura:logs:live")]
        DriverSwitch -->|No Redis or Offline| MemQueue["In-Memory Async Queue<br/>asyncio.Queue (max 10,000)"]
    end

    subgraph BatchPersistence ["Background Persistence Worker"]
        RedisList --> Flusher["Background Worker Loop<br/>(Drain up to 100 items / 1s)"]
        MemQueue --> Flusher
        Flusher --> Sanitizer["SanitizerService<br/>(PII & Secret Redaction)"]
        Sanitizer --> DB[("PostgreSQL api_logs<br/>(Single Bulk SQL Insert)")]
    end
```

### In-Process Host Logging vs. External Ingestion
- **Host Monolith**: Bypasses network loopback, HTTP serialization, and API keys. The ASGI middleware measures timing with `time.perf_counter()` and pushes directly into the queue in `~2 microseconds`.
- **External Ingestion**: Authenticated via `inno_log_live_*` scoped API keys over HTTP. Responses are returned immediately with `202 Accepted` after dropping payloads into the queue.
- **Auto-Fallback Safeguard**: If `REDIS_URL` is configured but Redis goes offline or connection drops, Tracura automatically diverts traffic to the local in-memory ring buffer with zero dropped logs and zero user downtime.


