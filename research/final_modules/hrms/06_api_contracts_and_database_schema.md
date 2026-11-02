# HRMS Specification: Database Relational Schema & REST OpenAPI 3.1 Contracts

**Document Reference:** `research/final_modules/hrms/06_api_contracts_and_database_schema.md`  
**Classification:** Technical Data Dictionary & API Implementation Specifications  
**Compliance Standard:** Indian Statutory Acts (UIDAI Aadhaar, Income Tax, EPFO, ESIC), International (W-4, I-9), and ISO/IEC 27001  
**Status:** Approved Canonical Specification  

---

## 1. Complete PostgreSQL Relational DDL Specification

```sql
-- Schema Extension Configurations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMERATION TYPES
-- ============================================================================

CREATE TYPE employment_status AS ENUM (
    'DRAFT', 'INVITED', 'ONBOARDING', 'ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'ALUMNI'
);

CREATE TYPE contract_type AS ENUM (
    'PERMANENT_FULL_TIME', 'PERMANENT_PART_TIME', 'CONTRACTOR', 'INTERN', 'RETAINER_CONSULTANT'
);

CREATE TYPE gender_type AS ENUM (
    'MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'
);

CREATE TYPE marital_status_type AS ENUM (
    'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'
);

CREATE TYPE blood_group_type AS ENUM (
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 
    'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
);

CREATE TYPE address_type AS ENUM (
    'CURRENT', 'PERMANENT'
);

CREATE TYPE residence_type AS ENUM (
    'OWNED', 'RENTED', 'COMPANY_PROVIDED', 'PARENTAL'
);

CREATE TYPE bank_account_type AS ENUM (
    'SAVINGS', 'SALARY_CORPORATE', 'CURRENT'
);

CREATE TYPE penny_drop_status AS ENUM (
    'PENDING', 'VERIFIED', 'FAILED'
);

CREATE TYPE disbursal_mode AS ENUM (
    'NEFT', 'RTGS', 'IMPS', 'ACH', 'WIRE_TRANSFER', 'CHEQUE'
);

CREATE TYPE family_relationship AS ENUM (
    'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'GUARDIAN'
);

CREATE TYPE qualification_level AS ENUM (
    'DOCTORATE', 'POST_GRADUATE', 'UNDERGRADUATE', 'DIPLOMA', 'HIGHER_SECONDARY', 'SECONDARY'
);

CREATE TYPE document_category AS ENUM (
    'IDENTITY_PROOF', 'ADDRESS_PROOF', 'ACADEMIC_RECORD', 'EXPERIENCE_LETTER', 'LEGAL_AGREEMENT', 'TAX_FORM'
);

CREATE TYPE document_verification_status AS ENUM (
    'PENDING_UPLOAD', 'SUBMITTED', 'VERIFIED_BY_HR', 'REJECTED_WITH_REASON'
);

CREATE TYPE punch_direction AS ENUM ('IN', 'OUT');
CREATE TYPE attendance_block_status AS ENUM ('NORMAL', 'LATE', 'HALF_DAY', 'OVERTIME', 'MISSING_OUT', 'REGULARIZED');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE leave_action AS ENUM ('ACCRUED', 'CONSUMED', 'ENCASHED', 'LAPSED', 'REVERSED');
CREATE TYPE component_type AS ENUM ('EARNING', 'DEDUCTION_PRE_TAX', 'DEDUCTION_POST_TAX', 'STATUTORY_TAX');
CREATE TYPE payroll_stage AS ENUM ('DRAFT', 'CALCULATING', 'REVIEW', 'COMMITTED', 'PAID');
CREATE TYPE clearance_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ============================================================================
-- 1. PARTY & IDENTITY CORE (STEP 1: PERSONAL & DEMOGRAPHICS)
-- ============================================================================

CREATE TABLE hrms_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    salutation VARCHAR(16),
    legal_first_name VARCHAR(100) NOT NULL,
    legal_middle_name VARCHAR(100),
    legal_last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    marital_status marital_status_type NOT NULL,
    marriage_date DATE,
    blood_group blood_group_type NOT NULL,
    nationality VARCHAR(2) NOT NULL DEFAULT 'IN', -- ISO-3166-1 alpha-2
    father_name VARCHAR(150) NOT NULL, -- Statutory Form 2 / Form 11 requirement
    mother_name VARCHAR(150) NOT NULL,
    spouse_name VARCHAR(150),
    is_differently_abled BOOLEAN NOT NULL DEFAULT FALSE,
    disability_details TEXT,
    personal_email VARCHAR(255) NOT NULL,
    mobile_phone VARCHAR(32) NOT NULL,
    alternate_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_party_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);
CREATE INDEX idx_hrms_parties_tenant ON hrms_parties(tenant_id);
CREATE UNIQUE INDEX uq_party_tenant_email ON hrms_parties(tenant_id, personal_email) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. ENCRYPTED STATUTORY IDENTITY VAULT (STEP 3: STATUTORY & NATIONAL IDS)
-- ============================================================================

CREATE TABLE hrms_statutory_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    
    -- Indian Statutory Identification
    aadhaar_number_enc BYTEA NOT NULL, -- AES-256 encrypted via pgcrypto
    aadhaar_masked VARCHAR(20) NOT NULL, -- XXXX-XXXX-1234
    aadhaar_virtual_id VARCHAR(20),
    pan_number_enc BYTEA NOT NULL, -- AES-256 encrypted
    pan_number_masked VARCHAR(15) NOT NULL, -- ABCDE****F
    uan_number VARCHAR(12), -- 12-digit EPFO Universal Account Number
    previous_pf_member_id VARCHAR(64), -- Previous PF member ID for online Form 13 transfer
    esic_number VARCHAR(17), -- 17-digit ESIC insurance registration
    professional_tax_state VARCHAR(64), -- Registration circle (e.g. Karnataka, Maharashtra)
    lwf_state_code VARCHAR(16), -- Labour Welfare Fund code
    
    -- Global & International Travel Documents
    passport_number_enc BYTEA,
    passport_expiry_date DATE,
    passport_place_of_issue VARCHAR(100),
    visa_type VARCHAR(50),
    visa_number VARCHAR(50),
    visa_expiry_date DATE,
    driving_license_number VARCHAR(50),
    voter_id_number VARCHAR(50),
    
    -- International Tax Equivalents
    us_ssn_enc BYTEA,
    us_ssn_masked VARCHAR(15),
    uk_nino_enc BYTEA,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_party_statutory UNIQUE (tenant_id, party_id)
);

-- ============================================================================
-- 3. ADDRESSES & EMERGENCY CONTACTS (STEP 2: RESIDENCY & ESCALATIONS)
-- ============================================================================

CREATE TABLE hrms_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    type address_type NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
    residence_type residence_type NOT NULL DEFAULT 'RENTED',
    is_same_as_current BOOLEAN NOT NULL DEFAULT FALSE,
    proof_document_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_party_address_type UNIQUE (party_id, type)
);

CREATE TABLE hrms_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    contact_name VARCHAR(150) NOT NULL,
    relationship family_relationship NOT NULL,
    primary_phone VARCHAR(32) NOT NULL,
    alternate_phone VARCHAR(32),
    residential_address TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. BANKING & DISBURSEMENTS (STEP 4: DIRECT DEPOSIT)
-- ============================================================================

CREATE TABLE hrms_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    branch_address TEXT,
    account_number_enc BYTEA NOT NULL,
    account_number_masked VARCHAR(30) NOT NULL,
    account_type bank_account_type NOT NULL DEFAULT 'SALARY_CORPORATE',
    ifsc_code VARCHAR(11) NOT NULL, -- Regex: ^[A-Z]{4}0[A-Z0-9]{6}$
    micr_code VARCHAR(9),
    account_holder_name VARCHAR(150) NOT NULL,
    penny_drop_status penny_drop_status NOT NULL DEFAULT 'PENDING',
    disbursal_mode disbursal_mode NOT NULL DEFAULT 'NEFT',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ifsc_format CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

-- ============================================================================
-- 5. EMPLOYEE MASTER & HIERARCHY (STEP 5: ORGANIZATIONAL TAXONOMY)
-- ============================================================================

CREATE TABLE hrms_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE RESTRICT,
    employee_code VARCHAR(32) NOT NULL,
    biometric_badge_id VARCHAR(64),
    work_email VARCHAR(255) NOT NULL,
    
    -- Organizational Taxonomy
    legal_entity_id UUID NOT NULL, -- Link to Corporate Operating Legal Entity
    business_unit VARCHAR(64),
    department VARCHAR(64) NOT NULL,
    sub_department VARCHAR(64),
    cost_center_code VARCHAR(32) NOT NULL DEFAULT 'CC-DEFAULT',
    
    -- Hierarchy & Seniority
    title VARCHAR(128) NOT NULL,
    grade_band VARCHAR(16) NOT NULL DEFAULT 'L3', -- L1 to L7, M1 to M4
    manager_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    dotted_line_manager_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    hrbp_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    
    -- Location & Work Topology
    location_id VARCHAR(64) NOT NULL DEFAULT 'HQ',
    work_mode VARCHAR(32) NOT NULL DEFAULT 'IN_OFFICE', -- IN_OFFICE, REMOTE_WFH, HYBRID, CLIENT_SITE
    shift_policy_id UUID,
    holiday_calendar_id UUID,
    
    -- Lifecycle & Dates
    status employment_status NOT NULL DEFAULT 'DRAFT',
    hire_date DATE NOT NULL,
    probation_period_days INT NOT NULL DEFAULT 90,
    probation_end_date DATE,
    confirmation_date DATE,
    notice_period_days INT NOT NULL DEFAULT 60,
    notice_start_date DATE,
    termination_date DATE,
    
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
    contract_type contract_type NOT NULL DEFAULT 'PERMANENT_FULL_TIME',
    base_salary NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    working_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. EDUCATION & PREVIOUS EMPLOYMENT (STEPS 6 & 7: EXPERIENCE & DEGREES)
-- ============================================================================

CREATE TABLE hrms_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    qualification_level qualification_level NOT NULL,
    degree_name VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150) NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    board_or_university VARCHAR(200) NOT NULL,
    start_year INT NOT NULL,
    passing_year INT NOT NULL,
    scoring_format VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE',
    score_value VARCHAR(32) NOT NULL,
    certificate_document_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hrms_previous_employments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    last_drawn_annual_ctc NUMERIC(15, 2),
    company_website VARCHAR(255),
    reporting_manager_name VARCHAR(150),
    reporting_manager_contact VARCHAR(100),
    reason_for_leaving TEXT,
    previous_pf_member_id VARCHAR(50),
    has_relieving_letter BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exp_dates CHECK (end_date >= start_date)
);

-- ============================================================================
-- 7. DEPENDENTS & STATUTORY NOMINEES (STEP 8: FORM 2 & FORM F)
-- ============================================================================

CREATE TABLE hrms_dependents_nominees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    relationship family_relationship NOT NULL,
    date_of_birth DATE NOT NULL,
    is_minor BOOLEAN NOT NULL DEFAULT FALSE,
    guardian_name VARCHAR(150),
    guardian_relationship family_relationship,
    residential_address TEXT,
    
    -- Statutory Nomination Allocations (Each fund must sum to 100% across nominees)
    pf_nomination_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    eps_nomination_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    gratuity_nomination_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    gtli_nomination_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Health Insurance GMC Coverage
    is_covered_under_mediclaim BOOLEAN NOT NULL DEFAULT FALSE,
    pre_existing_conditions TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. COMPLIANCE DOCUMENT VAULT (STEP 9: VERIFIED ASSETS & E-SIGN)
-- ============================================================================

CREATE TABLE hrms_document_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    category document_category NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    storage_uri VARCHAR(512) NOT NULL, -- Encrypted S3/MinIO bucket path
    verification_status document_verification_status NOT NULL DEFAULT 'PENDING_UPLOAD',
    verified_by UUID REFERENCES hrms_employees(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hrms_doc_party ON hrms_document_vault(tenant_id, party_id, category);

-- ============================================================================
-- 9. MULTI-STEP ONBOARDING TRACKER & STEPPER ENGINE
-- ============================================================================

CREATE TABLE hrms_onboarding_steppers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    current_step INT NOT NULL DEFAULT 1, -- 1 through 8
    step_1_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Core Personal
    step_2_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Addresses & Emergency
    step_3_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Statutory Vault
    step_4_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Bank & Disbursement
    step_5_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Hierarchy & Taxonomy
    step_6_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Education
    step_7_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Prior Experience
    step_8_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Statutory Nominees
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    is_hr_approved BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by UUID REFERENCES hrms_employees(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_stepper UNIQUE (tenant_id, employee_id)
);

CREATE TABLE hrms_onboarding_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    step_number INT NOT NULL CHECK (step_number BETWEEN 1 AND 8),
    draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Relaxed schema allowing incomplete partial inputs
    client_version INT NOT NULL DEFAULT 1,
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_step_draft UNIQUE (tenant_id, employee_id, step_number)
);
CREATE INDEX idx_hrms_onboarding_drafts ON hrms_onboarding_drafts(tenant_id, employee_id, step_number);

-- ============================================================================
-- 10. ATTENDANCE & PUNCH NORMALIZATION
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
-- 11. LEAVE GOVERNANCE & LEDGER
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
    days NUMERIC(5, 2) NOT NULL,
    reference_id UUID,
    remarks TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leave_ledger_balance ON hrms_leave_ledger(tenant_id, employee_id, leave_type_id);

-- ============================================================================
-- 12. PAYROLL ENGINE & SALARY STRUCTURES
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
    gl_journal_id UUID
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
-- 13. OFFBOARDING & EXIT CLEARANCES
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

### 2.1 Employee Master & Multi-Step Onboarding Engine

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/employees` | List employee directory with filter by department, band, location, and status | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/employees` | Initialize candidate draft profile and trigger sequential employee code | `peopleops:write` | 201 Created |
| `GET` | `/peopleops/employees/{id}` | Retrieve comprehensive 360 employee profile across all 9 sections | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/employees/{id}` | Update organizational taxonomy, title, department, or manager links | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/onboarding/{id}/stepper` | Fetch candidate 9-step completion status and remaining requirements | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/onboarding/{id}/step/{n}/draft` | Debounced auto-save payload (relaxed validation, saves to draft JSONB) | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/onboarding/{id}/step/{n}/draft` | Fetch latest draft for active step (used during cross-device hydration) | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/step/{n}/commit` | Synchronous step validation & promotion to canonical master tables | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/beacon-flush` | Emergency beacon flush (`sendBeacon`) executed on browser tab close | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/submit` | Candidate final submission of all steps for HR compliance review | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/verify-step`| HR auditor approves or requests changes with reason on step $n$ | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/documents/upload` | Upload compliance file to encrypted vault, generate SHA-256 hash | `peopleops:write` | 201 Created |
| `GET` | `/peopleops/documents/{id}/download` | Stream authenticated presigned URL for document viewing/download | `peopleops:read` | 200 OK |

### 2.2 Statutory Verification & Lookup Tools

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/tools/validate-aadhaar` | Executes Verhoeff algorithm on 12-digit input; returns validity | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/tools/validate-pan` | Validates 10-char regex and verifies 4th character is 'P' (Person) | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/tools/lookup-ifsc/{code}`| Resolves RBI directory to return Bank Name, Branch, and MICR code | `peopleops:read` | 200 OK |

### 2.3 Attendance, Timesheets & Normalization

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/attendance/punch` | 1-Click web/biometric punch clock ingestion (IN / OUT / BREAK) | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/active-session`| Return current day active timer, first punch, and elapsed minutes | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/summary` | Query monthly working hours, late arrivals, and LOP deductions | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/attendance/regularize` | Submit punch regularization request with reason for manager sign-off | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/attendance/regularize/{id}`| Line manager approves or rejects punch regularization | `peopleops:manager` | 200 OK |

### 2.4 Leave Governance & Ledgers

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/leaves/balances` | Retrieve real-time available leave balance matrix across all types | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/leaves/apply` | Submit formal leave application with sandwich rule computation | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/leaves/{id}/status` | Manager approves or rejects pending leave application with reason | `peopleops:manager` | 200 OK |
| `GET` | `/peopleops/leaves/team-presence` | Get real-time departmental presence radar ("Who's out today") | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/leaves/ledger/{employee_id}`| Audit trail of all accruals, debits, carry-forwards, and encashments | `peopleops:read` | 200 OK |

### 2.5 Payroll Engine & Disbursals

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/payroll/runs` | Initialize a new monthly payroll run for a target pay period | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/payroll/runs/{id}/calculate`| Execute DAG gross-to-net computation across all employee contracts | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/runs/{id}/commit` | Commit payroll, generate LedgerFlow journal & bank payout file | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/runs/{id}/bank-csv`| Export bank payout format (NEFT/RTGS/ACH) for bulk corporate upload | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payslips/my-payslips` | List historical monthly payslips for logged-in employee | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/payslips/{id}/pdf` | Download signed, password-protected PDF payslip | `peopleops:read` (self) | 200 OK |

### 2.6 Offboarding & Final Settlement (F&F)

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/separations/initiate` | Record employee resignation or termination and set Last Working Day | `peopleops:write` | 201 Created |
| `PATCH` | `/peopleops/separations/{id}/clearance`| Update departmental clearance status (IT, Finance, Facilities, HR) | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/separations/{id}/calculate-fnf`| Compute Full & Final settlement including gratuity & encashment | `peopleops:admin` | 200 OK |
