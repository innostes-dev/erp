# Innostes Business OS: Platform Plugins

The `plugins/` directory contains developer tools, observability engines, and infrastructure extensions for the **Innostes Business Operating System (Business OS)**.

---

## 1. Modules vs. Plugins: Key Distinction

| Category | Location | Purpose | Examples |
| :--- | :--- | :--- | :--- |
| **Business Modules** | `modules/` | End-user operational workflows (CRM, workforce, finance, inventory). | SalesFlow, PeopleOps, LedgerFlow. |
| **Platform Plugins** | `plugins/` | Technical infrastructure, developer tooling, logging, telemetry, and external integrations. | Tracura (API Telemetry & Observability). |

---

## 2. Active Platform Plugins

### Tracura: Universal API Telemetry Engine (`plugins/tracura`)
- **Dual-Mode Observability**: Functions both as an **in-process ASGI telemetry middleware** for the host Innostes Business OS (capturing internal request metrics in $<0.002$ms without loopback overhead) and as an **external polyglot telemetry sink** for microservices, mobile gateways, and AI/LLM proxies.
- **Privacy & Security**: Built-in PII redactor (recursively sanitizing passwords, tokens, API keys, and zero-masking IP addresses for GDPR compliance).
- **Hybrid Buffer**: High-throughput Redis queue with automatic non-blocking in-memory ring buffer fallback.

---

## 3. Creating a Platform Plugin

Plugins follow the same decoupled dual-package structure as business suites:
- `plugins/<name>/backend`: Python package registering with `api-server`.
- `plugins/<name>/frontend`: React package registering with `web-app`.

---

## 4. License

All plugins are open-source software licensed under the **[MIT License](../LICENSE)**.
