# Innostes Tracura (Frontend)

The frontend client package (`@innostes/tracura`) for **Tracura Universal API Telemetry & Observability** in the Innostes Business Operating System.

---

## 1. Overview

`@innostes/tracura` is rendered by the turnkey web application (`apps/web-app`). It provides:
- A standardized **Plugin Manifest** (`tracuraManifest`) mounting the `/plugins/tracura` route and navigation badge in the App Switcher.
- The **TracuraPage** component:
  - Real-time telemetry dashboard (request counts, error rates, p50/p95/p99 latency percentiles).
  - Searchable, filterable **Request Logs Explorer** with real-time tailing.
  - Interactive **Drawer Inspector** showing full HTTP request/response headers, sanitized payloads, and query parameters.
  - **Scoped Ingestion Key Manager** for creating and revoking API keys.
  - Retention and PII scrubbing policy settings.

---

## 2. Directory Structure

```
plugins/tracura/frontend/
├── src/
│   ├── index.ts          # Package entry point exporting manifest and TracuraPage
│   ├── manifest.ts       # PluginManifest metadata loaded by web-app
│   └── TracuraPage.tsx   # Complete telemetry console, charts, and drawer inspector
├── package.json
└── README.md
```

---

## 3. License

Open-source software licensed under the **[MIT License](../../../LICENSE)**.
