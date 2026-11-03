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
CREATE TYPE profile_approval_mode AS ENUM ('AUTO_APPROVE', 'MANUAL_APPROVE');
CREATE TYPE change_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- ============================================================================
-- 0. TIERED MASTER DATA: STRUCTURAL ENTITIES & LIGHTWEIGHT PICKLISTS
-- ============================================================================

-- Tier 1A: Departments Master (Hierarchical with Head of Department)
CREATE TABLE hrms_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- Machine code e.g. 'ENG_KERNEL'
    name VARCHAR(255) NOT NULL, -- Human label e.g. 'Core Kernel Systems'
    parent_id UUID REFERENCES hrms_departments(id) ON DELETE SET NULL,
    manager_id UUID, -- References hrms_employees(id)
    cost_center_code VARCHAR(64), -- Completely optional (startups do not use cost centers)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_dept_code UNIQUE (tenant_id, code)
);

-- Tier 1B: Designations Master (Pure Functional Titles - Zero Pay Constraints)
CREATE TABLE hrms_designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- e.g. 'STAFF_ENG'
    name VARCHAR(255) NOT NULL, -- e.g. 'Staff Distributed Systems Engineer'
    job_family VARCHAR(64),     -- Optional grouping e.g. 'ENGINEERING'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_desig_code UNIQUE (tenant_id, code)
);

-- Tier 1C: Office Locations & Branches Master (Geofencing & Timezone)
CREATE TABLE hrms_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- e.g. 'BLR_HQ'
    name VARCHAR(255) NOT NULL, -- e.g. 'Bengaluru Tech Park HQ'
    physical_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geofence_radius_meters INT NOT NULL DEFAULT 200,
    ip_whitelist_cidrs TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_loc_code UNIQUE (tenant_id, code)
);

-- Tier 2: Lightweight Dynamic Picklists (Document Types, Relationships, Degrees)
CREATE TABLE hrms_picklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'DOCUMENT_TYPE', 'RELATIONSHIP', 'DEGREE_LEVEL', 'EMPLOYMENT_TYPE'
    code VARCHAR(64) NOT NULL,     -- 'DOC_AADHAAR', 'REL_SPOUSE', 'EMP_PERM_FT'
    name VARCHAR(255) NOT NULL,    -- Human readable label
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_picklist_code UNIQUE (tenant_id, category, code)
);
CREATE INDEX idx_hrms_picklists ON hrms_picklists(tenant_id, category, is_active, display_order);

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
    marital_status marital_status_type, -- Optional
    marriage_date DATE,
    blood_group blood_group_type, -- Optional (never blocks candidate if unknown on Day 1)
    nationality VARCHAR(2) NOT NULL DEFAULT 'IN', -- ISO-3166-1 alpha-2
    father_name VARCHAR(150), -- Optional at master level; conditionally verified for Indian EPF
    mother_name VARCHAR(150), -- Optional
    spouse_name VARCHAR(150),
    is_differently_abled BOOLEAN NOT NULL DEFAULT FALSE,
    disability_details TEXT,
    personal_email VARCHAR(255) NOT NULL,
    mobile_phone VARCHAR(32) NOT NULL,
    alternate_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_hrms_parties_tenant ON hrms_parties(tenant_id);
CREATE UNIQUE INDEX uq_party_tenant_email ON hrms_parties(tenant_id, personal_email) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. ENCRYPTED STATUTORY IDENTITY VAULT (STEP 3: STATUTORY & NATIONAL IDS)
-- ============================================================================

-- Isolated Aadhaar Data Vault (ADV) - UIDAI Section 29 Compliant
CREATE TABLE kernel_aadhaar_vault (
    reference_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL,
    aadhaar_ciphertext BYTEA NOT NULL, -- AES-256-GCM envelope-encrypted with KMS
    dek_wrapped BYTEA NOT NULL,        -- Data Encryption Key wrapped by KMS Master KEK
    kek_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Restricted Vault Permissions: General app user cannot query the ADV directly
REVOKE ALL ON kernel_aadhaar_vault FROM PUBLIC;

CREATE TABLE hrms_statutory_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    
    -- Indian Statutory Identification (Aadhaar Data Vault Reference Scheme)
    aadhaar_reference_key UUID NOT NULL REFERENCES kernel_aadhaar_vault(reference_key),
    aadhaar_masked VARCHAR(20) NOT NULL, -- XXXX-XXXX-1234 (Only masked format stored in app tables)
    aadhaar_virtual_id VARCHAR(20),
    
    -- Envelope Encrypted Permanent Account Number (PAN)
    pan_number_enc BYTEA NOT NULL, -- AES-256-GCM encrypted
    pan_number_masked VARCHAR(15) NOT NULL, -- ABCDE****F
    pan_search_hash VARCHAR(64) NOT NULL, -- HMAC-SHA256 blind index for O(1) duplicate checks
    
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
    CONSTRAINT uq_party_statutory UNIQUE (tenant_id, party_id),
    CONSTRAINT uq_pan_search_hash UNIQUE (tenant_id, pan_search_hash)
);
CREATE INDEX idx_hrms_statutory_pan_hash ON hrms_statutory_identities(tenant_id, pan_search_hash);

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
    branch_name VARCHAR(150),
    branch_address TEXT,
    account_number_enc BYTEA NOT NULL, -- AES-256-GCM envelope encrypted
    account_number_masked VARCHAR(30) NOT NULL,
    account_number_search_hash VARCHAR(64) NOT NULL, -- HMAC-SHA256 blind index
    account_type bank_account_type NOT NULL DEFAULT 'SALARY_CORPORATE',
    routing_identifier VARCHAR(64) NOT NULL, -- Holds IFSC (India), Routing/ABA (US), Sort Code (UK), IBAN (EU)
    routing_identifier_type VARCHAR(32) NOT NULL DEFAULT 'IFSC', -- IFSC, ROUTING_ABA, SORT_CODE, IBAN
    micr_code VARCHAR(9),
    account_holder_name VARCHAR(150) NOT NULL,
    penny_drop_status penny_drop_status NOT NULL DEFAULT 'PENDING',
    disbursal_mode disbursal_mode NOT NULL DEFAULT 'NEFT',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hrms_bank_hash ON hrms_bank_accounts(tenant_id, account_number_search_hash);

-- ============================================================================
-- 5. EMPLOYEE MASTER & HIERARCHY (STEP 5: ORGANIZATIONAL TAXONOMY)
-- ============================================================================

CREATE TABLE hrms_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE RESTRICT,
    user_id UUID, -- References kernel users(id) for authentication & credential state
    employee_code VARCHAR(32) NOT NULL,
    biometric_badge_id VARCHAR(64),
    work_email VARCHAR(255) NOT NULL,
    
    -- Organizational Taxonomy (Code-First Natural Keys)
    legal_entity_id UUID NOT NULL, -- Link to Corporate Operating Legal Entity
    business_unit VARCHAR(64),
    department_code VARCHAR(64) NOT NULL, -- Foreign key to hrms_departments(tenant_id, code)
    sub_department VARCHAR(64),
    cost_center_code VARCHAR(32), -- Completely optional (startups do not use cost centers)
    
    -- Hierarchy & Seniority
    designation_code VARCHAR(64) NOT NULL, -- Foreign key to hrms_designations(tenant_id, code)
    grade_band VARCHAR(64), -- Optional leveling (startups leave this null)
    manager_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    dotted_line_manager_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    hrbp_id UUID REFERENCES hrms_employees(id) ON DELETE SET NULL,
    
    -- Location & Work Topology
    location_code VARCHAR(64) NOT NULL DEFAULT 'HQ', -- Foreign key to hrms_locations(tenant_id, code)
    work_mode VARCHAR(32) NOT NULL DEFAULT 'IN_OFFICE', -- IN_OFFICE, REMOTE_WFH, HYBRID, CLIENT_SITE
    shift_policy_id UUID,
    holiday_calendar_id UUID,
    
    -- Lifecycle & Dates
    status employment_status NOT NULL DEFAULT 'DRAFT',
    hire_date DATE NOT NULL,
    probation_period_days INT, -- Optional: NULL indicates direct confirmation on Day 1
    probation_end_date DATE,
    confirmation_date DATE,
    notice_period_days INT NOT NULL DEFAULT 30, -- Company configurable per hire
    notice_start_date DATE,
    termination_date DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_tenant_employee_code UNIQUE(tenant_id, employee_code),
    CONSTRAINT uq_tenant_work_email UNIQUE(tenant_id, work_email),
    CONSTRAINT fk_emp_dept FOREIGN KEY (tenant_id, department_code) REFERENCES hrms_departments(tenant_id, code) ON UPDATE CASCADE,
    CONSTRAINT fk_emp_desig FOREIGN KEY (tenant_id, designation_code) REFERENCES hrms_designations(tenant_id, code) ON UPDATE CASCADE,
    CONSTRAINT fk_emp_loc FOREIGN KEY (tenant_id, location_code) REFERENCES hrms_locations(tenant_id, code) ON UPDATE CASCADE
);
CREATE INDEX idx_hrms_employees_tenant ON hrms_employees(tenant_id, status);
CREATE INDEX idx_hrms_employees_manager ON hrms_employees(manager_id);

CREATE TABLE hrms_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(64) NOT NULL DEFAULT 'PERMANENT_FULL_TIME',
    base_salary NUMERIC(18, 4) NOT NULL, -- Total compensation freedom: company decides any amount
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    pay_frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, HOURLY, ANNUAL, STIPEND
    working_hours_per_week NUMERIC(5, 2), -- Completely optional / flexible
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
    department VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    last_drawn_annual_ctc NUMERIC(15, 2),
    company_website VARCHAR(255),
    reporting_manager_name VARCHAR(150),
    reporting_manager_email VARCHAR(255),
    reporting_manager_contact VARCHAR(100),
    hr_contact_email VARCHAR(255),
    reason_for_leaving TEXT,
    previous_pf_member_id VARCHAR(50),
    has_relieving_letter BOOLEAN NOT NULL DEFAULT FALSE,
    relieving_letter_id UUID,
    payslips_doc_ids UUID[] DEFAULT '{}',
    form_16_doc_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exp_dates CHECK (end_date >= start_date)
);

CREATE TABLE hrms_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'TECHNICAL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tenant_skill UNIQUE (tenant_id, code)
);

CREATE TABLE hrms_employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    skill_code VARCHAR(64) NOT NULL,
    proficiency_level VARCHAR(32) NOT NULL DEFAULT 'INTERMEDIATE',
    years_of_experience NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_party_skill UNIQUE (tenant_id, party_id, skill_code)
);

CREATE TABLE hrms_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    party_id UUID NOT NULL REFERENCES hrms_parties(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issuing_authority VARCHAR(200) NOT NULL,
    license_number VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    never_expires BOOLEAN NOT NULL DEFAULT FALSE,
    verification_url VARCHAR(512),
    certificate_doc_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hrms_onboarding_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    laptop_preference VARCHAR(64) NOT NULL DEFAULT 'MACOS_PRO',
    tshirt_size VARCHAR(16) NOT NULL DEFAULT 'L',
    dietary_preference VARCHAR(64) NOT NULL DEFAULT 'NON_VEGETARIAN',
    ergonomic_accommodations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_preferences UNIQUE (tenant_id, employee_id)
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
-- 8B. PROFILE FIELD GOVERNANCE & CHANGE REQUESTS (TWO-TIER APPROVAL ENGINE)
-- ============================================================================

CREATE TABLE hrms_profile_field_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    section_code VARCHAR(64) NOT NULL, -- e.g. 'SKILLS', 'BANK_ACCOUNT', 'ADDRESS_PERMANENT'
    field_name VARCHAR(64) NOT NULL DEFAULT '*', -- '*' for entire section or specific field
    is_employee_editable BOOLEAN NOT NULL DEFAULT FALSE,
    approval_mode profile_approval_mode NOT NULL DEFAULT 'MANUAL_APPROVE',
    requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_section_field UNIQUE (tenant_id, section_code, field_name)
);

CREATE TABLE hrms_profile_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    section_code VARCHAR(64) NOT NULL,
    field_name VARCHAR(64) NOT NULL DEFAULT '*',
    old_value JSONB NOT NULL, -- Exact snapshot of existing verified live data
    new_value JSONB NOT NULL, -- Proposed new data requested by employee
    supporting_document_id UUID, -- Optional attachment (e.g. new cancelled cheque leaf)
    status change_request_status NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES hrms_employees(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    effective_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hrms_change_req_status ON hrms_profile_change_requests(tenant_id, status);
CREATE INDEX idx_hrms_change_req_emp ON hrms_profile_change_requests(tenant_id, employee_id);

-- ============================================================================
-- 9. MULTI-STEP ONBOARDING TRACKER & STEPPER ENGINE
-- ============================================================================

CREATE TABLE hrms_onboarding_steppers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    current_step INT NOT NULL DEFAULT 1, -- 1 through 10
    step_1_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Core Personal & Demographics (with Languages)
    step_2_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Addresses & Emergency Contacts
    step_3_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Statutory Vault (Aadhaar, PAN, UAN, Passport)
    step_4_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Bank & Direct Disbursement
    step_5_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Prior Employment & Relieving Documents
    step_6_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Technical Skills, Tools & Certifications
    step_7_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Educational Qualifications
    step_8_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Statutory Nominees & Dependents
    step_9_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Work Equipment & Asset Preferences
    step_10_completed BOOLEAN NOT NULL DEFAULT FALSE, -- Final Review & Candidate Integrity Declaration
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    is_hr_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_sealed BOOLEAN NOT NULL DEFAULT FALSE, -- Sealed upon HR approval & transition to ACTIVE
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
    step_number INT NOT NULL CHECK (step_number BETWEEN 1 AND 10),
    draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Relaxed schema allowing incomplete partial inputs
    client_version INT NOT NULL DEFAULT 1,
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_step_draft UNIQUE (tenant_id, employee_id, step_number)
);
CREATE INDEX idx_hrms_onboarding_drafts ON hrms_onboarding_drafts(tenant_id, employee_id, step_number);

-- Database Hard Guard: Onboarding drafts can ONLY be mutated when employee is in ONBOARDING or INVITED status
CREATE OR REPLACE FUNCTION fn_guard_onboarding_drafts()
RETURNS TRIGGER AS $$
DECLARE
    v_status employment_status;
BEGIN
    SELECT status INTO v_status FROM hrms_employees WHERE id = NEW.employee_id;
    IF v_status NOT IN ('INVITED', 'ONBOARDING') THEN
        RAISE EXCEPTION 'ONBOARDING_SEALED: Cannot modify onboarding drafts when employee status is %', v_status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_onboarding_drafts
BEFORE INSERT OR UPDATE ON hrms_onboarding_drafts
FOR EACH ROW EXECUTE FUNCTION fn_guard_onboarding_drafts();

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
    is_unlimited BOOLEAN NOT NULL DEFAULT FALSE, -- Supports modern Unlimited PTO
    annual_quota NUMERIC(5, 2) DEFAULT 12.00,
    carry_forward_cap NUMERIC(5, 2) DEFAULT 0.00,
    is_encashable BOOLEAN NOT NULL DEFAULT FALSE,
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

-- ============================================================================
-- 14. ROW-LEVEL SECURITY (RLS) POLICIES FOR PII & MULTI-TENANCY
-- ============================================================================

ALTER TABLE hrms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_picklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_statutory_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_onboarding_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_departments_isolation ON hrms_departments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_designations_isolation ON hrms_designations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_locations_isolation ON hrms_locations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_picklists_isolation ON hrms_picklists
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_parties_isolation ON hrms_parties
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_statutory_isolation ON hrms_statutory_identities
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_bank_isolation ON hrms_bank_accounts
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_drafts_isolation ON hrms_onboarding_drafts
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_employees_isolation ON hrms_employees
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```

---

## 2. Exhaustive REST OpenAPI 3.1 Endpoint Catalog

All routes are mounted under `/peopleops` and require valid JWT authentication plus active tenant context headers (`X-Tenant-ID`).

### 2.1 Employee Master & Multi-Step Onboarding Engine

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/employees` | List employee directory with filter by department, band, location, and status | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/employees` | Initialize candidate draft profile and trigger sequential employee code | `peopleops:write` | 201 Created |
| `POST` | `/peopleops/employees/quick-add` | Founder 60-second hire: creates user, party, employee, contract, auto-generates temp password with `must_change_password=TRUE` & returns copyable payload | `peopleops:write` | 201 Created |
| `GET` | `/peopleops/employees/{id}` | Retrieve comprehensive 360 employee profile across all 8 sections | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/employees/{id}` | Update organizational taxonomy, title, department, or manager links | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/employees/{id}/reset-password` | Administrative reset: invalidates active sessions, auto-generates a new temporary password with `must_change_password=TRUE`, and notifies employee | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/employees/{id}/resend-invite` | Re-dispatches welcome credentials with new temporary password | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/onboarding/pipeline` | Fetch incoming candidate pre-onboarding tracking pipeline with progress % and days to start | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/nudge` | Send contextual reminder nudge to candidate via WhatsApp, SMS, and Email | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/onboarding/{id}/stepper` | Fetch candidate 8-step completion status and remaining requirements | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/onboarding/{id}/step/{n}/draft` | Debounced auto-save payload (guarded: requires status=ONBOARDING, returns 403 ONBOARDING_SEALED if ACTIVE) | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/onboarding/{id}/step/{n}/draft` | Fetch latest draft for active step (used during cross-device hydration) | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/step/{n}/commit` | Synchronous step validation & promotion to canonical master tables (guarded: status=ONBOARDING only) | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/beacon-flush` | Emergency beacon flush (`sendBeacon`) executed on browser tab close | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/submit` | Candidate final submission of all steps for HR compliance review | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/verify-step`| HR auditor approves step $n$ and promotes data to canonical master | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/request-correction`| HR auditor flags specific step or document for correction with structured reason note | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/onboarding/{id}/activate` | HR Final Approval & Day 1 Activation: sets status=ACTIVE, seals onboarding draft (is_sealed=TRUE), and unlocks ERP login access | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/documents/upload` | Upload compliance file to encrypted vault, generate SHA-256 hash | `peopleops:write` | 201 Created |
| `GET` | `/peopleops/documents/{id}/download` | Stream authenticated presigned URL for document viewing/download | `peopleops:read` | 200 OK |

### 2.2 Profile Field Governance & Change Requests (Two-Tier Approval Engine)

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/settings/profile-policies` | Retrieve field mutability configuration matrix (editable toggles & approval modes) | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/settings/profile-policies` | Update field mutability matrix: configure which fields active employees can edit and toggle AUTO_APPROVE vs MANUAL_APPROVE | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/profile/change-requests` | Active employee submits profile change. If AUTO_APPROVE, commits immediately to master; if MANUAL_APPROVE, stages in PENDING queue | `peopleops:read` (self) | 201 Created |
| `GET` | `/peopleops/profile/my-change-requests` | List current employee's pending and historical profile change requests | `peopleops:read` (self) | 200 OK |
| `DELETE` | `/peopleops/profile/change-requests/{id}` | Employee cancels an unapproved pending change request | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/approvals/profile-changes` | HR queue of pending profile change requests awaiting verification | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/approvals/profile-changes/{id}/approve` | HR approves change request: atomically commits new data to canonical master table | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/approvals/profile-changes/{id}/reject` | HR rejects change request with mandatory reason note; live profile stays untouched | `peopleops:admin` | 200 OK |

### 2.3 Dynamic Tenant Master Data Management (MDM)

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/masters` | Query master options filtered by category (`?category=DEPARTMENT&active_only=true`) | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/masters/categories` | List all available master categories with counts and descriptions | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/masters` | Create a new custom master item in a category | `peopleops:admin` | 201 Created |
| `PATCH` | `/peopleops/masters/{id}` | Update master name, description, display order, or active status | `peopleops:admin` | 200 OK |
| `DELETE` | `/peopleops/masters/{id}` | Delete custom master (blocked if referenced by active employees) | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/masters/reseed-defaults` | Re-seed missing system default masters for the tenant | `peopleops:admin` | 200 OK |

### 2.4 Statutory Verification & Lookup Tools

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/tools/validate-aadhaar` | Executes Verhoeff algorithm on 12-digit input; returns validity | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/tools/validate-pan` | Validates 10-char regex and verifies 4th character is 'P' (Person) | `peopleops:write` | 200 OK |
| `GET` | `/peopleops/tools/lookup-ifsc/{code}`| Resolves RBI directory to return Bank Name, Branch, and MICR code | `peopleops:read` | 200 OK |

### 2.5 Time, Attendance & Timesheets

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/attendance/punch` | 1-Click web/biometric punch clock ingestion (IN / OUT / BREAK) | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/active-session`| Return current day active timer, first punch, and elapsed minutes | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/timesheet` | Query monthly timesheet for Calendar or List view (`?month=2026-11&mode=calendar\|list`) | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/attendance/day` | Detailed single-day chronological punch pairs and break intervals (`?date=2026-11-04`) | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/attendance/summary` | Query monthly aggregate working hours, present days, and absent days | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/attendance/regularize` | Submit punch regularization request with reason for manager sign-off | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/attendance/regularize/{id}`| Line manager approves or rejects punch regularization | `peopleops:manager` | 200 OK |

### 2.6 Leave Governance & Ledgers

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/leaves/balances` | Retrieve real-time available leave balance matrix across all types | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/leaves/apply` | Submit formal leave application with sandwich rule computation | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/leaves/{id}/status` | Manager approves or rejects pending leave application with reason | `peopleops:manager` | 200 OK |
| `GET` | `/peopleops/leaves/team-presence` | Get real-time departmental presence radar ("Who's out today") | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/leaves/ledger/{employee_id}`| Audit trail of all accruals, debits, carry-forwards, and encashments | `peopleops:read` | 200 OK |

### 2.7 Payroll Engine & Disbursals

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/payroll/runs` | Initialize a new monthly payroll run for a target pay period | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/payroll/runs/{id}/calculate`| Execute DAG gross-to-net computation across all employee contracts | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/runs/{id}/commit` | Commit payroll, generate LedgerFlow journal & bank payout file | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/runs/{id}/bank-csv`| Export bank payout format (NEFT/RTGS/ACH) for bulk corporate upload | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payslips/my-payslips` | List historical monthly payslips for logged-in employee | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/payslips/{id}/pdf` | Download signed, password-protected PDF payslip | `peopleops:read` (self) | 200 OK |

### 2.8 Offboarding & Final Settlement (F&F)

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/separations/initiate` | Record employee resignation or termination and set Last Working Day | `peopleops:write` | 201 Created |
| `PATCH` | `/peopleops/separations/{id}/clearance`| Update departmental clearance status (IT, Finance, Facilities, HR) | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/separations/{id}/calculate-fnf`| Compute Full & Final settlement including gratuity & encashment | `peopleops:admin` | 200 OK |
