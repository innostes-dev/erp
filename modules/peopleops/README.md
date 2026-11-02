# PeopleOps: Workforce & HRMS Suite

**PeopleOps** is the official workforce, team directory, and human resource management suite for the **Innostes Business Operating System (Business OS)**.

It provides a modern alternative to bloated, spreadsheet-heavy HR tools—enabling teams to manage employee directories, organizational hierarchies, time-off requests, and payroll records directly from a unified open-source platform.

---

## 1. Capabilities & Sub-Features

- **Team Directory (`employees`)**: Centralized employee records, role assignments, department mappings, and contact information.
- **Leave Management (`leave`)**: Time-off balances, request submissions, approval hierarchies, and company leave calendars.
- **Attendance & Check-in (`attendance`)**: Workday tracking, timesheet logging, and shift scheduling.
- **Payroll Processing (`payroll`)**: Salary structures, allowances, tax deductions, and historical pay stubs.

---

## 2. Package Architecture

PeopleOps is structured as a decoupled full-stack module:

```
modules/peopleops/
├── backend/                  # innostes_peopleops Python package
│   ├── peopleops/            # FastAPI router, schemas, and service logic
│   ├── tests/                # Unit test suite
│   ├── pyproject.toml        # Declares innostes.modules entry point
│   └── README.md             # Backend developer guide
│
├── frontend/                 # @innostes/peopleops React package
│   ├── src/                  # Manifest, PeopleOpsPage, tabs, and actions
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
