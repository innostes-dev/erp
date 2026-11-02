# SalesFlow: CRM & Revenue Pipeline Suite

**SalesFlow** is the official customer relationship management (CRM), revenue pipeline, and deal forecasting suite for the **Innostes Business Operating System (Business OS)**.

Designed for modern high-velocity sales and account teams, SalesFlow eliminates bulky enterprise form fatigue, offering an intuitive, dense visual workspace for tracking deals, managing inbound leads, advancing pipeline stages, and generating quotes.

---

## 1. Capabilities & Sub-Features

- **Deals Kanban & Pipeline (`deals` / `pipeline`)**: Visual stage progression (Lead $\rightarrow$ Qualified $\rightarrow$ Proposal $\rightarrow$ In Negotiation $\rightarrow$ Closed Won), deal values, win probability, and stage duration tracking.
- **Inbound Lead Tracking (`leads`)**: Marketing form captures, lead scoring, qualification stages, and auto-assignment.
- **Account & Contact Timeline (`contacts`)**: 360-degree timeline of client interactions, meeting logs, notes, and associated enterprise stakeholders.
- **Quote & Proposal Generation**: Instant quote creation, line items, multi-currency pricing, and PDF exports.

---

## 2. Package Architecture

SalesFlow is structured as a decoupled full-stack module:

```
modules/salesflow/
├── backend/                  # innostes_salesflow Python package
│   ├── salesflow/            # FastAPI router, schemas, and service logic
│   ├── tests/                # Unit test suite
│   ├── pyproject.toml        # Declares innostes.modules entry point
│   └── README.md             # Backend developer guide
│
├── frontend/                 # @innostes/salesflow React package
│   ├── src/                  # Manifest, SalesFlowPage, tabs, and actions
│   ├── package.json          # Workspace package metadata
│   └── README.md             # Frontend developer guide
│
└── README.md                 # Module overview
```

---

## 3. Quick Links

- [Backend Documentation](backend/README.md): API routes, Pydantic schemas, and backend tests.
- [Frontend Documentation](frontend/README.md): React manifest, components, and UI layout.

---

## 4. License

Open-source software licensed under the **[MIT License](../../LICENSE)**.
