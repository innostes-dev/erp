# HRMS Specification: Database Relational Schema & REST OpenAPI 3.1 Contracts

**Document Target:** `research/final_modules/hrms/06_api_contracts_and_database_schema.md`  
**Classification:** Technical Data Dictionary & API Implementation Specifications  

---

## 1. Complete PostgreSQL Relational DDL Specification

```sql
-- Schema Extension Configurations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enumeration Types
CREATE TYPE employment_status AS ENUM ('DRAFT', 'ONBOARDING', 'ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'ALUMNI');
CREATE TYPE contract_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN');
CREATE TYPE punch_direction AS ENUM ('IN', 'OUT');
CREATE TYPE attendance_block_status AS ENUM ('NORMAL', 'LATE', 'HALF_DAY', 'OVERTIME', 'MISSING_OUT', 'REGULARIZED');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE leave_action AS ENUM ('ACCRUED', 'CONSUMED', 'ENCASHED', 'LAPSED', 'REVERSED');
CREATE TYPE component_type AS ENUM ('EARNING', 'DEDUCTION_PRE_TAX', 'DEDUCTION_POST_TAX', 'STATUTORY_TAX');
CREATE TYPE payroll_stage AS ENUM ('DRAFT', 'CALCULATING', 'REVIEW', 'COMMITTED', 'PAID');
CREATE TYPE clearance_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ============================================================================
-- 1. PARTY & IDENTITY CORE
-- ============================================================================

CREATE TABLE hrms_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    legal_first_name VARCHAR(128) NOT NULL,
    legal_last_name VARCHAR(128) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(32),
    nationality VARCHAR(64) NOT NULL,
    tax_residency_country VARCHAR(2) NOT NULL DEFAULT 'IN',
    encrypted_national_id TEXT NOT NULL, -- AES-256 encrypted SSN/PAN
    personal_email VARCHAR(255) NOT NULL,
    mobile_phone VARCHAR(32) NOT NULL,
    residential_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_hrms_parties_tenant ON hrms_parties(tenant_id);

-- ============================================================================
-- 2. EMPLOYEE MASTER & CONTRACTS
-- ============================================================================

CREATE TABLE hrms_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE RESTRICT,
    employee_code VARCHAR(32) NOT NULL,
    work_email VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    status employment_status NOT NULL DEFAULT 'DRAFT',
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    notice_start_date DATE,
    termination_date DATE,
    department VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    location_id VARCHAR(64) NOT NULL DEFAULT 'HQ',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_tenant_employee_code UNIQUE(tenant_id, employee_code),
    CONSTRAINT uq_tenant_work_email UNIQUE(tenant_id, work_email)
);
CREATE INDEX idx_hrms_employees_tenant ON hrms_employees(tenant_id, status);
CREATE INDEX idx_hrms_employees_manager ON hrms_employees(manager_id);

CREATE TABLE hrms_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    contract_type contract_type NOT NULL DEFAULT 'FULL_TIME',
    base_salary NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    working_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. ATTENDANCE & PUNCH NORMALIZATION
-- ============================================================================

CREATE TABLE hrms_attendance_punches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    punch_time TIMESTAMPTZ NOT NULL,
    direction punch_direction NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'web', -- web, mobile_gps, biometric
    location_geo JSONB DEFAULT '{}'::jsonb,
    is_manual_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hrms_punches_emp_time ON hrms_attendance_punches(tenant_id, employee_id, punch_time);

CREATE TABLE hrms_attendance_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    in_time TIMESTAMPTZ NOT NULL,
    out_time TIMESTAMPTZ,
    total_duration_minutes INT NOT NULL DEFAULT 0,
    late_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    work_location VARCHAR(32) NOT NULL DEFAULT 'office', -- office, home, field
    status attendance_block_status NOT NULL DEFAULT 'NORMAL',
    CONSTRAINT uq_emp_date_in UNIQUE(tenant_id, employee_id, work_date, in_time)
);
CREATE INDEX idx_hrms_attendance_date ON hrms_attendance_blocks(tenant_id, work_date);

-- ============================================================================
-- 4. LEAVE GOVERNANCE & LEDGER
-- ============================================================================

CREATE TABLE hrms_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    annual_quota NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    carry_forward_cap NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    is_encashable BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_sandwich_rule_active BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_tenant_leave_code UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hrms_leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(5, 2) NOT NULL,
    status leave_status NOT NULL DEFAULT 'PENDING',
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES hrms_employees(id),
    decision_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_date_span CHECK (end_date >= start_date)
);

CREATE TABLE hrms_leave_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hrms_leave_types(id),
    transaction_date DATE NOT NULL,
    action leave_action NOT NULL,
    days NUMERIC(5, 2) NOT NULL, -- Positive for credit, negative for debit
    reference_id UUID,
    remarks TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leave_ledger_balance ON hrms_leave_ledger(tenant_id, employee_id, leave_type_id);

-- ============================================================================
-- 5. PAYROLL ENGINE & SALARY STRUCTURES
-- ============================================================================

CREATE TABLE hrms_salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    type component_type NOT NULL,
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    formula_expression TEXT,
    depends_on JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT uq_tenant_salary_comp UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    contract_id UUID NOT NULL REFERENCES hrms_contracts(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES hrms_salary_components(id),
    fixed_amount NUMERIC(18, 4),
    effective_from DATE NOT NULL,
    effective_to DATE
);

CREATE TABLE hrms_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    stage payroll_stage NOT NULL DEFAULT 'DRAFT',
    total_gross_pay NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_net_pay NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_tax_withheld NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    processed_by UUID,
    committed_at TIMESTAMPTZ,
    gl_journal_id UUID -- Link to committed LedgerFlow Journal Entry
);

CREATE TABLE hrms_payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    payroll_run_id UUID NOT NULL REFERENCES hrms_payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE RESTRICT,
    working_days INT NOT NULL DEFAULT 30,
    loss_of_pay_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    gross_pay NUMERIC(18, 4) NOT NULL,
    total_deductions NUMERIC(18, 4) NOT NULL,
    net_pay NUMERIC(18, 4) NOT NULL,
    CONSTRAINT chk_net_non_negative CHECK (net_pay >= 0.0000),
    CONSTRAINT uq_run_emp UNIQUE(payroll_run_id, employee_id)
);

CREATE TABLE hrms_payslip_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payslip_id UUID NOT NULL REFERENCES hrms_payslips(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES hrms_salary_components(id),
    amount NUMERIC(18, 4) NOT NULL,
    component_type component_type NOT NULL
);
CREATE INDEX idx_payslip_components_lookup ON hrms_payslip_components(payslip_id, component_type);

-- ============================================================================
-- 6. OFFBOARDING & EXIT CLEARANCES
-- ============================================================================

CREATE TABLE hrms_separations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id),
    resignation_date DATE NOT NULL,
    last_working_day DATE NOT NULL,
    reason TEXT NOT NULL,
    notice_shortfall_days INT NOT NULL DEFAULT 0,
    is_gratuity_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    it_clearance clearance_status NOT NULL DEFAULT 'PENDING',
    finance_clearance clearance_status NOT NULL DEFAULT 'PENDING',
    facilities_clearance clearance_status NOT NULL DEFAULT 'PENDING',
    hr_clearance clearance_status NOT NULL DEFAULT 'PENDING',
    final_settlement_amount NUMERIC(18, 4),
    settlement_paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Exhaustive REST OpenAPI 3.1 Endpoint Catalog

All routes are mounted under `/peopleops` and require valid JWT authentication plus active tenant context headers (`X-Tenant-ID`).

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/employees` | List employee roster with department, location, and status filters | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/employees` | Create a new employee record and assign sequential code | `peopleops:write` | 201 Created |
| `GET` | `/peopleops/employees/{id}` | Retrieve comprehensive employee profile with contracts | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/employees/{id}` | Update employee job title, manager, or status | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/attendance/punch` | 1-Click web/biometric punch clock ingestion | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/summary` | Query current month working hours, late minutes, and LOP count | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/attendance/regularize` | Submit punch regularization request for manager approval | `peopleops:read` (self) | 201 Created |
| `GET` | `/peopleops/leaves/balances` | Retrieve active leave balance matrix across all leave types | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/leaves/apply` | Submit formal leave application | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/leaves/{id}/status` | Approve or reject pending leave application (Manager) | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/payroll/runs` | Initialize a new draft monthly payroll run | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/payroll/runs/{id}/calculate` | Execute DAG gross-to-net computation across all staff | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/runs/{id}/commit` | Commit payroll, generate LedgerFlow journal & bank payout file | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payslips/my-payslips` | List historical monthly payslips for logged-in employee | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/payslips/{id}/pdf` | Download signed, password-protected PDF payslip | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/separations/initiate` | Record employee resignation or termination | `peopleops:write` | 201 Created |
| `POST` | `/peopleops/separations/{id}/calculate-fnf` | Compute Full & Final settlement including gratuity & encashment | `peopleops:admin` | 200 OK |
