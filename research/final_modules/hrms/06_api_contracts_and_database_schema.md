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
-- ARCHITECTURAL LAW: ZERO HARDCODED DATABASE ENUMS
-- ============================================================================
-- In Innostes Business OS, hardcoded PostgreSQL ENUM types are strictly prohibited.
-- All business dropdowns, classifications, and categories are dynamically governed
-- by tenant admins via Tier 1 Structural Masters or Tier 2 Lightweight Picklists
-- (hrms_picklists). System workflow states are stored as standard VARCHAR codes.
-- 
-- Why ENUMs are eliminated:
-- 1. Full Admin Sovereignty: Admins can add, reorder, rename, and deactivate options
--    from the UI in real time without engineering tickets or code deployments.
-- 2. Zero Migration Downtime: Adding or evolving options never triggers locking
--    ALTER TYPE DDL statements or requires production schema migrations.
-- 3. Multi-Tenant Independence: Tenants can configure industry-specific options 
--    without polluting or altering shared database schema types.
-- 4. Localization & Display: Picklists support display order, active/inactive toggles,
--    and localized display names natively.

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

-- Tier 1D: Holiday Calendars Master (Multi-Branch & Regional Schedules)
CREATE TABLE hrms_holiday_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- e.g. 'BLR_HQ_2026', 'MUMBAI_2026', 'US_REMOTE_2026'
    name VARCHAR(255) NOT NULL, -- e.g. 'Bengaluru HQ Holiday Calendar 2026'
    calendar_year INT NOT NULL, -- e.g. 2026
    location_id UUID REFERENCES hrms_locations(id) ON DELETE SET NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_cal_code UNIQUE (tenant_id, code)
);
CREATE INDEX idx_hrms_holiday_cal ON hrms_holiday_calendars(tenant_id, calendar_year, location_id);

CREATE TABLE hrms_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    calendar_id UUID NOT NULL REFERENCES hrms_holiday_calendars(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- e.g. 'Republic Day', 'Diwali', 'Kannada Rajyotsava'
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(32) NOT NULL DEFAULT 'MANDATORY', -- 'MANDATORY', 'OPTIONAL_FLOATING', 'COMPANY_SPECIAL'
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    half_day_period VARCHAR(16) DEFAULT 'FULL_DAY', -- 'FIRST_HALF', 'SECOND_HALF', 'FULL_DAY'
    description TEXT,
    observed_substitute_date DATE, -- If holiday falls on Sunday, observed date on Monday
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_calendar_holiday_date UNIQUE (calendar_id, holiday_date)
);
CREATE INDEX idx_hrms_holidays_date ON hrms_holidays(tenant_id, holiday_date);

-- Database Invariant Trigger: Historical Holidays (< CURRENT_DATE) are strictly immutable
CREATE OR REPLACE FUNCTION fn_guard_past_holidays()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.holiday_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'PAST_HOLIDAY_LOCKED: Cannot modify or delete historical holiday on % because past attendance and payroll cycles have already closed.', OLD.holiday_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_past_holidays
BEFORE UPDATE OR DELETE ON hrms_holidays
FOR EACH ROW EXECUTE FUNCTION fn_guard_past_holidays();

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
    gender VARCHAR(32) NOT NULL, -- References hrms_picklists category 'GENDER' ('MALE', 'FEMALE', etc.)
    marital_status VARCHAR(32),  -- References hrms_picklists category 'MARITAL_STATUS' ('SINGLE', 'MARRIED', etc.)
    marriage_date DATE,
    blood_group VARCHAR(16),     -- References hrms_picklists category 'BLOOD_GROUP' ('A+', 'B+', etc.)
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
    type VARCHAR(32) NOT NULL, -- References hrms_picklists category 'ADDRESS_TYPE' ('CURRENT', 'PERMANENT')
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
    residence_type VARCHAR(32) NOT NULL DEFAULT 'RENTED', -- References hrms_picklists category 'RESIDENCE_TYPE' ('OWNED', 'RENTED', etc.)
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
    relationship VARCHAR(64) NOT NULL, -- References hrms_picklists category 'RELATIONSHIP' ('SPOUSE', 'FATHER', etc.)
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
    account_type VARCHAR(64) NOT NULL DEFAULT 'SALARY_CORPORATE', -- References hrms_picklists category 'BANK_ACCOUNT_TYPE'
    routing_identifier VARCHAR(64) NOT NULL, -- Holds IFSC (India), Routing/ABA (US), Sort Code (UK), IBAN (EU)
    routing_identifier_type VARCHAR(32) NOT NULL DEFAULT 'IFSC', -- IFSC, ROUTING_ABA, SORT_CODE, IBAN
    micr_code VARCHAR(9),
    account_holder_name VARCHAR(150) NOT NULL,
    penny_drop_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'FAILED'
    disbursal_mode VARCHAR(64) NOT NULL DEFAULT 'NEFT', -- References hrms_picklists category 'DISBURSAL_MODE'
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
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'INVITED', 'ONBOARDING', 'ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'ALUMNI'
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
    qualification_level VARCHAR(64) NOT NULL, -- References hrms_picklists category 'QUALIFICATION_LEVEL' ('DOCTORATE', 'POST_GRADUATE', etc.)
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
    relationship VARCHAR(64) NOT NULL, -- References hrms_picklists category 'RELATIONSHIP' ('SPOUSE', 'SON', etc.)
    date_of_birth DATE NOT NULL,
    is_minor BOOLEAN NOT NULL DEFAULT FALSE,
    guardian_name VARCHAR(150),
    guardian_relationship VARCHAR(64), -- References hrms_picklists category 'RELATIONSHIP'
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
    category VARCHAR(64) NOT NULL, -- References hrms_picklists category 'DOCUMENT_CATEGORY' ('IDENTITY_PROOF', 'TAX_FORM', etc.)
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    storage_uri VARCHAR(512) NOT NULL, -- Encrypted S3/MinIO bucket path
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_UPLOAD', -- 'PENDING_UPLOAD', 'SUBMITTED', 'VERIFIED_BY_HR', 'REJECTED_WITH_REASON'
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
    approval_mode VARCHAR(32) NOT NULL DEFAULT 'MANUAL_APPROVE', -- 'AUTO_APPROVE', 'MANUAL_APPROVE'
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
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
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
    v_status VARCHAR(32);
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
    direction VARCHAR(16) NOT NULL, -- 'IN', 'OUT'
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
    status VARCHAR(32) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'LATE', 'HALF_DAY', 'OVERTIME', 'MISSING_OUT', 'REGULARIZED'
    CONSTRAINT uq_emp_date_in UNIQUE(tenant_id, employee_id, work_date, in_time)
);
CREATE INDEX idx_hrms_attendance_date ON hrms_attendance_blocks(tenant_id, work_date);

CREATE TABLE hrms_monthly_timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES hrms_employees(id), -- Reporting Lead / Approver
    period_month VARCHAR(7) NOT NULL, -- e.g. '2026-11'
    total_present_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    total_absent_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    total_leave_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    total_worked_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'LOCKED'
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES hrms_employees(id),
    approved_at TIMESTAMPTZ,
    rejection_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_monthly_timesheet UNIQUE (tenant_id, employee_id, period_month)
);
CREATE INDEX idx_hrms_timesheet_mgr ON hrms_monthly_timesheets(tenant_id, manager_id, status);

-- ============================================================================
-- 11. LEAVE GOVERNANCE & LEDGER (8-DIMENSION MODULAR POLICY ENGINE)
-- ============================================================================

CREATE TABLE hrms_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL, -- Machine code e.g. 'CL', 'SL', 'PL', 'MATERNITY', 'COMP_OFF'
    name VARCHAR(128) NOT NULL, -- Human label e.g. 'Casual Leave'
    description TEXT,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE, -- System seed default (prevents accidental hard delete)

    -- Dimension 1: Quota, Accrual Engine & Proration
    is_unlimited BOOLEAN NOT NULL DEFAULT FALSE, -- 1-Click Startup Unlimited PTO
    annual_quota NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    accrual_frequency VARCHAR(32) NOT NULL DEFAULT 'ANNUAL_LUMP_SUM', -- 'ANNUAL_LUMP_SUM', 'MONTHLY_PRO_RATA', 'QUARTERLY', 'EVENT_BASED', 'UNLIMITED'
    accrual_timing VARCHAR(32) NOT NULL DEFAULT 'BEGINNING_OF_PERIOD', -- 'BEGINNING_OF_PERIOD', 'END_OF_PERIOD'
    proration_rule VARCHAR(32) NOT NULL DEFAULT 'EXACT_DAYS', -- 'EXACT_DAYS', 'MID_MONTH_CUTOFF', 'NONE'

    -- Dimension 2: Carry-Forward, Rollover & Expiry
    can_carry_forward BOOLEAN NOT NULL DEFAULT FALSE,
    carry_forward_cap NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    carry_forward_expiry_months INT, -- Optional: expires after X months (e.g. 3 months / 90 days)

    -- Dimension 3: Financial Encashment
    is_encashable BOOLEAN NOT NULL DEFAULT FALSE,
    encashment_mode VARCHAR(32) NOT NULL DEFAULT 'UPON_SEPARATION_ONLY', -- 'UPON_SEPARATION_ONLY', 'ANNUAL_WINDOW', 'ON_DEMAND', 'NONE'
    encashment_salary_basis VARCHAR(32) NOT NULL DEFAULT 'BASIC_SALARY', -- 'BASIC_SALARY', 'GROSS_SALARY'
    encashment_min_balance_retained NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    encashment_max_days_per_year NUMERIC(5, 2) NOT NULL DEFAULT 0.00,

    -- Dimension 4: Booking & Application Constraints
    allow_half_day BOOLEAN NOT NULL DEFAULT TRUE,
    min_notice_days INT NOT NULL DEFAULT 0,
    max_consecutive_days INT, -- Optional cap (e.g. max 3 days for CL)
    allow_past_dating BOOLEAN NOT NULL DEFAULT TRUE,
    max_past_days INT NOT NULL DEFAULT 3, -- Max backdated days
    allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
    max_negative_days NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_mandatory_above_days INT, -- e.g. medical cert required if > 2 days

    -- Dimension 5: Weekend & Holiday Treatment (Sandwich Rule Engine)
    include_weekends BOOLEAN NOT NULL DEFAULT FALSE,
    include_holidays BOOLEAN NOT NULL DEFAULT FALSE,
    sandwich_rule_mode VARCHAR(32) NOT NULL DEFAULT 'DISABLED', -- 'DISABLED', 'SANDWICH_WEEKENDS', 'SANDWICH_ALL'

    -- Dimension 6 & 7: Lifecycle & Target Cohorts
    probation_rule VARCHAR(32) NOT NULL DEFAULT 'FULL_ACCESS', -- 'FULL_ACCESS', 'ACCRUE_ONLY_LOCKED', 'LOSS_OF_PAY_ONLY'
    notice_period_rule VARCHAR(32) NOT NULL DEFAULT 'MANAGER_DISCRETION', -- 'PROHIBITED', 'MANAGER_DISCRETION', 'EXTENDS_NOTICE_PERIOD'
    applicable_gender VARCHAR(32) NOT NULL DEFAULT 'ALL', -- 'ALL', 'MALE_ONLY', 'FEMALE_ONLY'
    applicable_employment_types VARCHAR(64)[] DEFAULT '{PERMANENT_FULL_TIME,PERMANENT_PART_TIME}',

    -- Dimension 8: Approval Routing & SLA
    approval_workflow VARCHAR(32) NOT NULL DEFAULT 'SINGLE_LEVEL_MANAGER', -- 'AUTO_APPROVE', 'SINGLE_LEVEL_MANAGER', 'TWO_TIER_MANAGER_SKIP', 'MANAGER_PLUS_HR'
    auto_approve_if_below_days NUMERIC(3, 1),
    sla_hours INT NOT NULL DEFAULT 48,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_leave_code UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hrms_leave_types(id),
    start_date DATE NOT NULL,
    start_half VARCHAR(16) NOT NULL DEFAULT 'FULL_DAY', -- 'FIRST_HALF', 'SECOND_HALF', 'FULL_DAY'
    end_date DATE NOT NULL,
    end_half VARCHAR(16) NOT NULL DEFAULT 'FULL_DAY',   -- 'FIRST_HALF', 'SECOND_HALF', 'FULL_DAY'
    base_days NUMERIC(5, 2) NOT NULL,                   -- Scheduled working days
    sandwich_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,  -- Intervening weekend/holiday days added by sandwich policy
    total_days NUMERIC(5, 2) NOT NULL,                  -- base_days + sandwich_days
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',      -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
    reason TEXT NOT NULL,
    supporting_document_id UUID,                        -- Optional/Mandatory medical cert or event proof
    manager_id UUID REFERENCES hrms_employees(id),       -- Assigned lead approver
    skip_level_id UUID REFERENCES hrms_employees(id),   -- For two-tier workflows
    approved_by UUID REFERENCES hrms_employees(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_date_span CHECK (end_date >= start_date)
);
CREATE INDEX idx_hrms_leave_app_emp ON hrms_leave_applications(tenant_id, employee_id, status);

CREATE TABLE hrms_leave_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hrms_leave_types(id),
    transaction_date DATE NOT NULL,
    action VARCHAR(32) NOT NULL, -- 'ACCRUED', 'CONSUMED', 'ENCASHED', 'LAPSED', 'REVERSED', 'ADJUSTED'
    days NUMERIC(5, 2) NOT NULL,
    reference_id UUID,           -- Application ID, Payroll Run ID, or Comp-Off Punch ID
    expires_at TIMESTAMPTZ,      -- Used for Comp-Off or Carry-Forward balance expiry
    remarks TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leave_ledger_balance ON hrms_leave_ledger(tenant_id, employee_id, leave_type_id);

-- ============================================================================
-- 12. PAYROLL ENGINE & SALARY STRUCTURES
-- ============================================================================

CREATE TABLE hrms_payroll_settings (
    tenant_id UUID PRIMARY KEY,
    pay_frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY', -- 'MONTHLY', 'BI_WEEKLY', 'SEMI_MONTHLY', 'WEEKLY'
    cycle_start_day INT NOT NULL DEFAULT 1,
    payout_day VARCHAR(32) NOT NULL DEFAULT 'LAST_DAY_OF_MONTH', -- 'LAST_DAY_OF_MONTH', '1ST_OF_NEXT_MONTH', '5TH', '7TH'
    lop_calculation_method VARCHAR(32) NOT NULL DEFAULT 'CALENDAR_DAYS', -- 'CALENDAR_DAYS', 'FIXED_26_DAYS', 'ACTUAL_WORK_DAYS'
    
    -- Modular Statutory Toggles (Disabled by default for early startups)
    enable_epf BOOLEAN NOT NULL DEFAULT FALSE,
    epf_calculation_mode VARCHAR(32) NOT NULL DEFAULT 'STATUTORY_CEILING_15K', -- 'STATUTORY_CEILING_15K', 'FULL_BASIC'
    epf_establishment_code VARCHAR(64),
    enable_esic BOOLEAN NOT NULL DEFAULT FALSE,
    esic_establishment_code VARCHAR(64),
    enable_professional_tax BOOLEAN NOT NULL DEFAULT FALSE,
    enable_lwf BOOLEAN NOT NULL DEFAULT FALSE,
    enable_gratuity BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Tax & Withholding Configuration
    default_tax_regime VARCHAR(32) NOT NULL DEFAULT 'SECTION_115BAC_NEW', -- 'SECTION_115BAC_NEW', 'OLD_REGIME'
    allow_midyear_regime_switch BOOLEAN NOT NULL DEFAULT FALSE,
    tax_declaration_window_end_day INT NOT NULL DEFAULT 30, -- April 30th statutory auto-lock
    
    -- Corporate Banking Rails & CMS Formats
    bank_cms_format VARCHAR(64) NOT NULL DEFAULT 'HDFC_CMS', -- 'HDFC_CMS', 'ICICI_CIB', 'AXIS_CMS', 'SBI_CMS', 'US_NACHA'
    corporate_bank_account_number VARCHAR(64),
    corporate_bank_ifsc VARCHAR(32),
    
    -- General Ledger Double-Entry Mapping (LedgerFlow Integration)
    gl_salary_expense_account_id UUID,
    gl_salaries_payable_account_id UUID,
    gl_tax_payable_account_id UUID,
    auto_post_gl_journal BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Payslip Branding & Security
    auto_dispatch_payslip_emails BOOLEAN NOT NULL DEFAULT TRUE,
    payslip_password_formula VARCHAR(64) NOT NULL DEFAULT 'NAME4_DOB_DDMM',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hrms_salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    classification VARCHAR(64) NOT NULL, -- 'EARNING', 'DEDUCTION_PRE_TAX', 'DEDUCTION_POST_TAX', 'STATUTORY_TAX', 'EMPLOYER_RETIRAL'
    calculation_mode VARCHAR(32) NOT NULL DEFAULT 'FLAT_AMOUNT', -- 'FLAT_AMOUNT', 'PERCENTAGE_OF', 'FORMULA_EXPRESSION', 'STATUTORY_SLAB', 'MONTHLY_VARIABLE'
    percentage_base VARCHAR(64), -- e.g. 'CTC', 'BASIC', 'GROSS', 'BASIC_DA'
    percentage_value NUMERIC(7, 4), -- e.g. 50.0000 for 50%, 12.0000 for 12%
    formula_expression TEXT, -- e.g. 'MAX(0, CTC - (BASIC + HRA + RETIRALS))'
    is_lop_prorated BOOLEAN NOT NULL DEFAULT TRUE,
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    tax_exemption_code VARCHAR(64), -- 'SEC_10_13A_HRA', 'SEC_10_14_CONVEYANCE', 'NON_TAXABLE_REIMBURSEMENT'
    part_of_ctc BOOLEAN NOT NULL DEFAULT TRUE,
    show_on_payslip BOOLEAN NOT NULL DEFAULT TRUE,
    hide_if_zero BOOLEAN NOT NULL DEFAULT TRUE,
    depends_on JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT uq_tenant_salary_comp UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    rounding_rule VARCHAR(32) NOT NULL DEFAULT 'NEAREST_INTEGER', -- 'NEAREST_INTEGER', 'CEILING', 'FLOOR', 'EXACT_DECIMAL'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_structure_code UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_salary_structure_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID NOT NULL REFERENCES hrms_salary_structures(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES hrms_salary_components(id) ON DELETE RESTRICT,
    sequence_order INT NOT NULL DEFAULT 1,
    calculation_mode_override VARCHAR(32),
    percentage_base_override VARCHAR(64),
    percentage_value_override NUMERIC(7, 4),
    formula_expression_override TEXT,
    fixed_amount_override NUMERIC(18, 4),
    CONSTRAINT uq_structure_component UNIQUE(structure_id, component_id)
);
CREATE INDEX idx_struct_comp_eval ON hrms_salary_structure_components(structure_id, sequence_order);

CREATE TABLE hrms_employee_salary_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    structure_id UUID NOT NULL REFERENCES hrms_salary_structures(id) ON DELETE RESTRICT,
    annual_ctc NUMERIC(18, 4) NOT NULL,
    monthly_base_salary NUMERIC(18, 4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    custom_component_overrides JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_emp_salary_assign ON hrms_employee_salary_assignments(tenant_id, employee_id, effective_from);

CREATE TABLE hrms_payslip_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    template_name VARCHAR(128) NOT NULL,
    theme VARCHAR(32) NOT NULL DEFAULT 'MODERN_MINIMAL', -- 'MODERN_MINIMAL', 'CLASSIC_CORPORATE', 'COMPACT_SINGLE_PAGE'
    brand_color_hex VARCHAR(16) NOT NULL DEFAULT '#2563EB',
    logo_position VARCHAR(16) NOT NULL DEFAULT 'LEFT', -- 'LEFT', 'CENTER', 'RIGHT'
    show_leave_balances BOOLEAN NOT NULL DEFAULT TRUE,
    show_employer_retirals BOOLEAN NOT NULL DEFAULT TRUE,
    show_ytd_summary BOOLEAN NOT NULL DEFAULT TRUE,
    show_amount_in_words BOOLEAN NOT NULL DEFAULT TRUE,
    show_qr_verification BOOLEAN NOT NULL DEFAULT TRUE,
    show_digital_signature BOOLEAN NOT NULL DEFAULT FALSE,
    digital_signature_url TEXT,
    visible_demographic_fields JSONB NOT NULL DEFAULT '["EMPLOYEE_ID", "NAME", "DESIGNATION", "DEPARTMENT", "JOINING_DATE", "BANK_ACCOUNT_MASKED", "IFSC", "PAN_MASKED", "UAN", "CALENDAR_DAYS", "LOP_DAYS", "PAID_DAYS"]'::jsonb,
    password_formula VARCHAR(64) NOT NULL DEFAULT 'NAME4_DOB_DDMM',
    custom_footer_note TEXT DEFAULT 'This is a computer-generated payslip and requires no physical signature.',
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hrms_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    stage VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'CALCULATING', 'REVIEW', 'COMMITTED', 'PAID'
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
    payslip_template_id UUID REFERENCES hrms_payslip_templates(id),
    working_days INT NOT NULL DEFAULT 30,
    loss_of_pay_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    gross_pay NUMERIC(18, 4) NOT NULL,
    total_deductions NUMERIC(18, 4) NOT NULL,
    net_pay NUMERIC(18, 4) NOT NULL,
    net_pay_in_words TEXT NOT NULL,
    leave_balances_snapshot JSONB DEFAULT '{}'::jsonb,
    employer_retirals_snapshot JSONB DEFAULT '{}'::jsonb,
    ytd_totals_snapshot JSONB DEFAULT '{}'::jsonb,
    pdf_storage_path TEXT,
    verification_hash VARCHAR(128),
    CONSTRAINT chk_net_non_negative CHECK (net_pay >= 0.0000),
    CONSTRAINT uq_run_emp UNIQUE(payroll_run_id, employee_id)
);

CREATE TABLE hrms_payslip_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payslip_id UUID NOT NULL REFERENCES hrms_payslips(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES hrms_salary_components(id),
    amount NUMERIC(18, 4) NOT NULL,
    component_type VARCHAR(64) NOT NULL -- 'EARNING', 'DEDUCTION_PRE_TAX', 'DEDUCTION_POST_TAX', 'STATUTORY_TAX', 'EMPLOYER_RETIRAL'
);
CREATE INDEX idx_payslip_components_lookup ON hrms_payslip_components(payslip_id, component_type);

-- ============================================================================
-- 12.1 INDIAN TAX DECLARATIONS, PROOFS & FORM 16 ENGINE
-- ============================================================================

CREATE TABLE hrms_tax_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    financial_year VARCHAR(16) NOT NULL, -- e.g. '2026-2027'
    regime VARCHAR(32) NOT NULL DEFAULT 'SECTION_115BAC_NEW', -- 'SECTION_115BAC_NEW', 'OLD_REGIME'
    is_regime_locked BOOLEAN NOT NULL DEFAULT FALSE,
    regime_locked_at TIMESTAMPTZ,
    regime_unlocked_by UUID,
    regime_unlock_reason TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED', -- 'DRAFT', 'SUBMITTED', 'VERIFICATION_IN_PROGRESS', 'LOCKED'
    total_declared_deductions NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_verified_deductions NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    CONSTRAINT uq_emp_fy_declaration UNIQUE(tenant_id, employee_id, financial_year)
);

CREATE TABLE hrms_tax_declaration_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id UUID NOT NULL REFERENCES hrms_tax_declarations(id) ON DELETE CASCADE,
    section_code VARCHAR(32) NOT NULL, -- '80C', '80D', 'SEC_10_13A_HRA', 'SEC_24_B_HOME_LOAN', '80CCD_1B', '80E', '80G'
    sub_category VARCHAR(64) NOT NULL, -- 'ELSS', 'LIC', 'PPF', 'RENT_METRO', 'RENT_NON_METRO', 'HEALTH_INSURANCE_PARENTS'
    declared_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    verified_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    landlord_or_lender_name VARCHAR(128),
    landlord_or_lender_pan VARCHAR(32),
    landlord_or_lender_address TEXT,
    proof_document_url TEXT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tax_items_lookup ON hrms_tax_declaration_items(declaration_id, section_code);

CREATE TABLE hrms_previous_employments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    financial_year VARCHAR(16) NOT NULL,
    previous_employer_name VARCHAR(128) NOT NULL,
    previous_employer_tan VARCHAR(32),
    gross_salary_paid NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    tds_deducted NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    epf_deducted NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    professional_tax_deducted NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    proof_form12b_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hrms_form16_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    financial_year VARCHAR(16) NOT NULL,
    part_a_traces_file_url TEXT,
    part_b_data JSONB NOT NULL,
    merged_signed_pdf_url TEXT,
    digital_signature_cert_serial VARCHAR(128),
    traces_token_number VARCHAR(64),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_to_employee_at TIMESTAMPTZ,
    CONSTRAINT uq_emp_fy_form16 UNIQUE(tenant_id, employee_id, financial_year)
);

-- ============================================================================
-- 12.2 APPROVAL DELEGATION & ESCALATION ENGINE
-- ============================================================================

CREATE TABLE hrms_approval_delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    delegator_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    delegatee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    proxy_type VARCHAR(32) NOT NULL DEFAULT 'SKIP_LEVEL_MANAGER', -- 'SKIP_LEVEL_MANAGER', 'LATERAL_PEER'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scope VARCHAR(64) NOT NULL DEFAULT 'ALL', -- 'ALL', 'LEAVES_ONLY', 'ATTENDANCE_REGULARIZATION_ONLY', 'TIMESHEETS_ONLY'
    notify_delegator_summary BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_delegation_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_no_self_delegation CHECK (delegator_id != delegatee_id)
);
CREATE INDEX idx_delegation_active ON hrms_approval_delegations(tenant_id, delegator_id, is_active, start_date, end_date);

-- ============================================================================
-- 12.3 EXPENSE REIMBURSEMENTS & UNIVERSAL APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE hrms_expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    max_limit_per_claim NUMERIC(18, 4),
    is_receipt_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    receipt_threshold_amount NUMERIC(18, 4) NOT NULL DEFAULT 500.0000,
    max_claim_age_days INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_tax_deductible_itc BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_exp_cat UNIQUE(tenant_id, code)
);

CREATE TABLE hrms_workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- 'EXPENSE_REIMBURSEMENT', 'LEAVE_APPLICATION', 'ATTENDANCE_REGULARIZATION', 'SALARY_ADVANCE'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_workflow UNIQUE(tenant_id, entity_type, name)
);

CREATE TABLE hrms_workflow_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES hrms_workflow_definitions(id) ON DELETE CASCADE,
    rule_name VARCHAR(128) NOT NULL,
    priority_order INT NOT NULL DEFAULT 1,
    condition_expression JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"amount_lte": 2000}
    sla_hours INT NOT NULL DEFAULT 48,
    on_sla_timeout VARCHAR(32) NOT NULL DEFAULT 'ESCALATE_TO_SKIP_LEVEL'
);

CREATE TABLE hrms_workflow_rule_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES hrms_workflow_rules(id) ON DELETE CASCADE,
    step_number INT NOT NULL DEFAULT 1,
    approver_type VARCHAR(32) NOT NULL, -- 'REPORTING_LEAD', 'SKIP_LEVEL_MANAGER', 'ROLE_BASED', 'DEPARTMENT_HEAD', 'SPECIFIC_USER', 'AUTO_APPROVE'
    target_role VARCHAR(64),
    target_user_id UUID REFERENCES hrms_employees(id)
);

CREATE TABLE hrms_expense_claim_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id) ON DELETE CASCADE,
    claim_number VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    business_purpose TEXT NOT NULL,
    cost_center VARCHAR(64),
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_tax_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'INGESTED_IN_PAYROLL', 'PAID_OUT_OF_CYCLE', 'REJECTED'
    current_workflow_step INT NOT NULL DEFAULT 1,
    settlement_destination VARCHAR(32) NOT NULL DEFAULT 'NEXT_PAYROLL', -- 'NEXT_PAYROLL', 'INSTANT_BANK_PAYOUT'
    payroll_run_id UUID REFERENCES hrms_payroll_runs(id),
    bank_disbursement_reference VARCHAR(128),
    submitted_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_claim_no UNIQUE(tenant_id, claim_number)
);

CREATE TABLE hrms_expense_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_report_id UUID NOT NULL REFERENCES hrms_expense_claim_reports(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES hrms_expense_categories(id),
    expense_date DATE NOT NULL,
    merchant_name VARCHAR(128) NOT NULL,
    merchant_gstin VARCHAR(32),
    amount NUMERIC(18, 4) NOT NULL,
    tax_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    is_client_billable BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_file_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' -- 'PENDING', 'APPROVED', 'REJECTED'
);
CREATE INDEX idx_exp_line_items ON hrms_expense_line_items(claim_report_id);

-- ============================================================================
-- 13. OFFBOARDING & FULL AND FINAL (F&F) SETTLEMENT ENGINE
-- ============================================================================

CREATE TABLE hrms_separations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id),
    exit_type VARCHAR(64) NOT NULL DEFAULT 'VOLUNTARY_RESIGNATION', -- 'VOLUNTARY_RESIGNATION', 'INVOLUNTARY_TERMINATION_WITHOUT_CAUSE', 'INVOLUNTARY_TERMINATION_WITH_CAUSE', 'RETIREMENT_SUPERANNUATION'
    separation_mode VARCHAR(32) NOT NULL DEFAULT 'ENTERPRISE', -- 'STARTUP_60_SECOND', 'ENTERPRISE'
    resignation_date DATE NOT NULL,
    requested_lwd DATE NOT NULL,
    approved_lwd DATE NOT NULL,
    contractual_notice_days INT NOT NULL DEFAULT 60,
    served_notice_days INT NOT NULL DEFAULT 60,
    notice_shortfall_days INT NOT NULL DEFAULT 0,
    notice_shortfall_waived BOOLEAN NOT NULL DEFAULT FALSE,
    waiver_reason TEXT,
    reason TEXT NOT NULL,
    internal_notes TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'INITIATED', -- 'INITIATED', 'NOTICE_PERIOD_ACTIVE', 'CLEARANCES_ACTIVE', 'CLEARANCES_APPROVED', 'FNF_COMPUTED', 'FNF_AUDITED', 'SETTLEMENT_DISBURSED', 'ACCESS_TERMINATED', 'WITHDRAWN'
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_separations_tenant_status ON hrms_separations(tenant_id, status);
CREATE INDEX idx_separations_emp ON hrms_separations(employee_id);

CREATE TABLE hrms_separation_clearance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    separation_id UUID NOT NULL REFERENCES hrms_separations(id) ON DELETE CASCADE,
    department VARCHAR(64) NOT NULL, -- 'IT', 'FINANCE', 'FACILITIES', 'HR_LEGAL'
    task_code VARCHAR(64) NOT NULL, -- e.g. 'IT_HARDWARE_RETURN', 'IDP_SUSPENSION', 'CORP_CARD_CANCEL', 'EXPENSE_AUDIT', 'FACILITY_BADGE_SURRENDER', 'EXIT_INTERVIEW'
    task_name VARCHAR(255) NOT NULL,
    assigned_to_role VARCHAR(64) NOT NULL, -- 'IT_ADMIN', 'FINANCE_CONTROLLER', 'FACILITIES_LEAD', 'HR_PARTNER'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'WAIVED'
    cleared_by UUID,
    cleared_at TIMESTAMPTZ,
    financial_recovery_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    recovery_remarks TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clearance_tasks_sep ON hrms_separation_clearance_tasks(separation_id, department);

CREATE TABLE hrms_settlement_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    separation_id UUID NOT NULL REFERENCES hrms_separations(id) ON DELETE CASCADE,
    final_working_days INT NOT NULL DEFAULT 0,
    pro_rata_salary NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    encashed_leave_days NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    leave_encashment_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    is_gratuity_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    tenure_years INT NOT NULL DEFAULT 0,
    gratuity_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    reimbursements_payable NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    notice_shortfall_deduction NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    salary_advance_unrecovered NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    departmental_asset_recoveries NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    final_tds_tax NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    final_professional_tax NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    net_payable_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    gl_journal_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'AUDITED', 'COMMITTED', 'DISBURSED'
    audited_by UUID,
    audited_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    bank_reference_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_settlement_sheet_sep ON hrms_settlement_sheets(separation_id);

CREATE TABLE hrms_exit_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    separation_id UUID NOT NULL REFERENCES hrms_separations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms_employees(id),
    doc_type VARCHAR(64) NOT NULL, -- 'RELIEVING_LETTER', 'EXPERIENCE_CERTIFICATE', 'FNF_STATEMENT', 'PROVISIONAL_FORM16'
    document_title VARCHAR(255) NOT NULL,
    file_storage_path TEXT NOT NULL,
    file_size_bytes INT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    is_dsc_signed BOOLEAN NOT NULL DEFAULT FALSE,
    dsc_signed_at TIMESTAMPTZ,
    dsc_signer_dn VARCHAR(255),
    alumni_visible BOOLEAN NOT NULL DEFAULT TRUE,
    alumni_accessible_until DATE NOT NULL, -- Enforces 7-year statutory post-exit retention
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_exit_docs_emp ON hrms_exit_documents(employee_id, doc_type);

-- ============================================================================
-- 14. ROW-LEVEL SECURITY (RLS) POLICIES FOR PII & MULTI-TENANCY
-- ============================================================================

ALTER TABLE hrms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_holiday_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employee_salary_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_payslip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_previous_employments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_form16_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_expense_claim_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_picklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_statutory_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_onboarding_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_separations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_separation_clearance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_settlement_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_exit_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_departments_isolation ON hrms_departments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_designations_isolation ON hrms_designations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_locations_isolation ON hrms_locations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_holiday_cals_isolation ON hrms_holiday_calendars
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_holidays_isolation ON hrms_holidays
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_payroll_settings_isolation ON hrms_payroll_settings
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_salary_components_isolation ON hrms_salary_components
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_salary_structures_isolation ON hrms_salary_structures
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_emp_salary_assign_isolation ON hrms_employee_salary_assignments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_payslip_templates_isolation ON hrms_payslip_templates
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_payroll_runs_isolation ON hrms_payroll_runs
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_payslips_isolation ON hrms_payslips
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_tax_decl_isolation ON hrms_tax_declarations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_prev_emp_isolation ON hrms_previous_employments
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_form16_isolation ON hrms_form16_records
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_approval_delegations_isolation ON hrms_approval_delegations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_expense_categories_isolation ON hrms_expense_categories
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_workflow_defs_isolation ON hrms_workflow_definitions
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_expense_claims_isolation ON hrms_expense_claim_reports
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

CREATE POLICY tenant_separations_isolation ON hrms_separations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_clearance_tasks_isolation ON hrms_separation_clearance_tasks
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_settlement_sheets_isolation ON hrms_settlement_sheets
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_exit_docs_isolation ON hrms_exit_documents
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
| `POST` | `/peopleops/attendance/timesheets/submit` | Employee submits monthly attendance timesheet for lead sign-off | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/attendance/timesheets/pending-approvals` | Reporting lead queries pending direct-report monthly timesheets | `peopleops:manager` | 200 OK |
| `POST` | `/peopleops/attendance/timesheets/{id}/approve` | Reporting lead signs off and locks monthly timesheet | `peopleops:manager` | 200 OK |
| `POST` | `/peopleops/attendance/timesheets/{id}/reject` | Reporting lead returns timesheet with change request comments | `peopleops:manager` | 200 OK |

### 2.5B Holiday Calendars & Annual Management

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/holiday-calendars` | List all holiday calendars with year, location bindings, and holiday counts | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/holiday-calendars` | Admin creates a new holiday calendar (e.g. for a branch office or remote cohort) | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/holiday-calendars/{id}/import-pack` | 1-Click statutory import of national/state public holiday packs (e.g. 'IN_KA_2027') | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/holiday-calendars/{id}/copy-from-year` | Clone fixed-date holidays from previous annual calendar into target year | `peopleops:admin` | 201 Created |
| `GET` | `/peopleops/holiday-calendars/{id}/holidays` | List all holidays for calendar; flags historical past dates as locked | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/holiday-calendars/{id}/holidays` | Admin adds a new upcoming corporate or regional holiday | `peopleops:admin` | 201 Created |
| `PUT` | `/peopleops/holiday-calendars/{id}/holidays/{holiday_id}` | Edit upcoming holiday (guarded: returns 400 PAST_HOLIDAY_LOCKED if date < CURRENT_DATE) | `peopleops:admin` | 200 OK |
| `DELETE` | `/peopleops/holiday-calendars/{id}/holidays/{holiday_id}` | Delete upcoming holiday (guarded: returns 400 PAST_HOLIDAY_LOCKED if date < CURRENT_DATE) | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/holidays/floating-options` | Employee retrieves available floating / optional holidays for their calendar | `peopleops:read` (self) | 200 OK |
| `POST` | `/peopleops/holidays/floating-claim` | Employee selects and claims their allocated floating holiday quota | `peopleops:read` (self) | 200 OK |

### 2.6 Leave Governance & Ledgers (Modular Policy Engine)

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/leave-types` | List all configured leave types with active 8-dimension policy matrix | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/leave-types` | Admin creates a new custom leave type with quota, carry-forward, encashment, & sandwich rules | `peopleops:admin` | 201 Created |
| `GET` | `/peopleops/leave-types/{id}` | Retrieve full 8-dimension policy specifications for a specific leave type | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/leave-types/{id}` | Admin updates policy rules (quota, rollover caps, encashment mode, notice days, sandwich rule) | `peopleops:admin` | 200 OK |
| `DELETE` | `/peopleops/leave-types/{id}` | Admin deletes custom leave type (deactivates if referenced in ledger) | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/leaves/preview` | Real-time pre-submission dry run: validates balance, computes sandwich days, and returns total deduction breakdown | `peopleops:read` (self) | 200 OK |
| `POST` | `/peopleops/leaves/apply` | Submit formal leave application with half-day flags and supporting document attachment | `peopleops:read` (self) | 201 Created |
| `PATCH` | `/peopleops/leaves/{id}/status` | Direct manager or HR approves/rejects application, posting CONSUMED transaction to ledger | `peopleops:manager` | 200 OK |
| `GET` | `/peopleops/leaves/balances` | Retrieve real-time available leave balance matrix across all types from ledger | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/leaves/team-presence` | Get real-time departmental presence radar ("Who's out today") | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/leaves/ledger/{employee_id}`| Audit trail of all accruals, debits, carry-forwards, encashments, and lapses | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/leaves/comp-off/grant` | Reporting lead converts verified weekend/holiday overtime punch into an active Comp-Off credit | `peopleops:manager` | 201 Created |
| `POST` | `/peopleops/leaves/encash/request` | Employee submits request to liquidate eligible excess leave balance | `peopleops:read` (self) | 201 Created |
| `POST` | `/peopleops/leaves/encash/{id}/approve` | HR approves encashment request, pushing financial payout to next payroll run | `peopleops:admin` | 200 OK |

### 2.7 Payroll Engine, Salary Structure Builder & Payslip Designer

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/payroll/settings` | Retrieve active tenant payroll configuration (frequency, LOP method, statutory toggles, bank rails) | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/payroll/settings` | Update tenant payroll setup (toggles for EPF, ESIC, PT, LOP formula, CMS format, GL accounts) | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/salary-components` | List all custom and standard salary components with math calculation modes and tax rules | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/payroll/salary-components` | Create custom component (% of component, flat amount, formula DAG, or variable) | `peopleops:admin` | 201 Created |
| `PUT` | `/peopleops/payroll/salary-components/{id}` | Update component formula expression, percentage base, taxable flag, or payslip visibility | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/structures` | List all named salary structure templates (e.g. Engineering CTC, Sales Plan, Intern Stipend) | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/payroll/structures` | Create a new named salary structure template with component hierarchy and rounding rules | `peopleops:admin` | 201 Created |
| `GET` | `/peopleops/payroll/structures/{id}` | Retrieve complete structure specifications, component rules, formulas, and sequence DAG | `peopleops:read` | 200 OK |
| `PUT` | `/peopleops/payroll/structures/{id}` | Update structure rules, percentage allocations, balancing residual component, or active status | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/structures/{id}/preview` | Dry-run gross-to-net calculation for a hypothetical CTC or base salary against this structure | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/payroll/structures/{id}/assign` | Assign salary structure to employee(s) with effective date versioning and individual contract overrides | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/payslip-templates` | List all configured visual payslip design templates | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/payroll/payslip-templates` | Create custom payslip design template (modular block toggles, branding, theme, password formula) | `peopleops:admin` | 201 Created |
| `PUT` | `/peopleops/payroll/payslip-templates/{id}` | Update payslip template design settings (visible demographic fields, leave cards, YTD card, colors) | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/payslip-templates/{id}/preview-pdf` | Render live vector PDF stream of payslip using sample employee data for instant designer preview | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/runs` | Initialize a new monthly payroll run for a target pay period | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/payroll/runs/{id}/calculate`| Execute DAG gross-to-net computation across all employee contracts in parallel | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/runs/{id}/commit` | Commit payroll run: seals period, auto-posts balanced GL journal to LedgerFlow, & generates bank batch | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/runs/{id}/bank-csv`| Export bank payout format (HDFC/ICICI/Axis/SBI CMS or US NACHA ACH) for corporate batch upload | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payslips/my-payslips` | List historical monthly payslips for logged-in employee | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/payslips/{id}/pdf` | Download signed, password-protected PDF payslip | `peopleops:read` (self) | 200 OK |
| `POST` | `/peopleops/payroll/tax-declarations` | Employee submits statutory Form 12BB declaration (Regime choice, 80C, 80D, HRA with landlord PAN, Home loan u/s 24) | `peopleops:read` (self) | 201 Created |
| `POST` | `/peopleops/payroll/tax-declarations/lock-regime` | System / Employee seals tax regime choice; locks selector against daily tampering for remainder of FY | `peopleops:read` (self) | 200 OK |
| `POST` | `/peopleops/payroll/tax-declarations/{id}/unlock-regime` | HR Admin emergency override to unlock regime for clerical error; requires mandatory audit justification | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/tax-declarations/me` | Retrieve active tax regime projection (Section 115BAC New vs Old comparison with monthly TDS breakdown) | `peopleops:read` (self) | 200 OK |
| `POST` | `/peopleops/payroll/tax-declarations/proofs` | Employee uploads actual receipts/certificates during proof verification window | `peopleops:read` (self) | 201 Created |
| `POST` | `/peopleops/payroll/tax-declarations/previous-employment` | Mid-year joiner submits statutory Form 12B details (previous gross salary, TDS, and PF) | `peopleops:read` (self) | 201 Created |
| `GET` | `/peopleops/payroll/tax-declarations/admin/review` | HR retrieves employee tax proofs for verification cockpit review | `peopleops:admin` | 200 OK |
| `PATCH` | `/peopleops/payroll/tax-declarations/items/{id}/verify` | HR approves, partially approves, or rejects proof with statutory rejection code | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/returns/24q/generate` | Generates official quarterly Form 24Q e-TDS text file (.fvu) with Annexure I & Annexure II | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/form16/import-traces-part-a` | Bulk uploads TRACES Part A archive for automated employee PAN mapping | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/payroll/form16/generate-part-b` | System natively generates statutory Form 16 Part B annexures for all employees | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/payroll/form16/merge-and-sign` | Merges Part A + Part B and applies Class 3 DSC digital signature to all Form 16 PDFs | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/payroll/form16/my-form16` | Employee downloads signed, merged Form 16 PDF from personal ESS vault | `peopleops:read` (self) | 200 OK |

### 2.8 Offboarding, Clearances & Full and Final (F&F) Settlement

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/separations/initiate` | Record employee resignation or termination, define exit type, and compute contractual notice period | `peopleops:write` | 201 Created |
| `POST` | `/peopleops/separations/quick-exit` | Founder 60-second exit: 1-click laptop return checklist, triggers IdP deprovisioning webhook, and calculates pro-rata salary | `peopleops:admin` | 201 Created |
| `GET` | `/peopleops/separations` | List all active and archived employee separations with filter by exit type, status, and LWD | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/separations/{id}` | Retrieve comprehensive separation 360 cockpit (timeline, notice days, clearance DAG, settlement statement) | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/separations/{id}/lwd-negotiate` | Manager/HR confirms or amends Last Working Day, calculates notice shortfall, and toggles waiver | `peopleops:manager` | 200 OK |
| `POST` | `/peopleops/separations/{id}/withdraw` | Employee withdraws resignation (requires line manager and HR approval) | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/separations/{id}/clearances` | List departmental clearance tasks across IT, Finance, Facilities, and HR with assigned roles | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/separations/{id}/clearances/{task_id}` | Department lead approves clearance, waives item, or enters financial damage recovery amount | `peopleops:write` | 200 OK |
| `POST` | `/peopleops/separations/{id}/calculate-fnf` | Settlement DAG engine computes pro-rata salary, leave encashment, gratuity, notice recovery, asset deductions, and final TDS | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/separations/{id}/audit-fnf` | Controller/HR signs off on settlement sheet; moves status to AUDITED | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/separations/{id}/commit-fnf` | Final settlement commit: posts balanced double-entry GL journal in LedgerFlow and enqueues bank payout batch | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/separations/{id}/bank-batch` | Export corporate bank payout file (CMS/ACH) for final settlement net disbursal | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/separations/{id}/exit-documents/generate-all` | Renders Relieving Letter, Service Certificate, and F&F Statement; signs with corporate Class 3 DSC | `peopleops:admin` | 201 Created |
| `GET` | `/peopleops/separations/{id}/exit-documents/{doc_type}/pdf` | Stream signed vector PDF of exit document for HR or employee | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/alumni/my-documents` | Alumni portal endpoint: retrieve list of available historical payslips, Form 16, and signed exit letters | `peopleops:read` (alumni) | 200 OK |
| `GET` | `/peopleops/alumni/documents/{id}/download` | Stream authenticated download of exit documents (enforces 7-year statutory post-exit retention) | `peopleops:read` (alumni) | 200 OK |

### 2.9 Approval Routing, Delegations & Team Operations

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/peopleops/approvals/delegations` | Lead configures Out of Office (OOO) approval proxy delegation to skip-level manager or peer | `peopleops:manager` | 201 Created |
| `GET` | `/peopleops/approvals/delegations/my` | Retrieve active and scheduled delegations for logged-in lead | `peopleops:read` (self) | 200 OK |
| `DELETE` | `/peopleops/approvals/delegations/{id}`| Revoke active delegation early upon early return from leave | `peopleops:manager` | 200 OK |
| `GET` | `/peopleops/approvals/team-queue` | Retrieve manager's unified pending approval queue (leaves, regularizations, comp-offs, escalated tasks) | `peopleops:manager` | 200 OK |
| `POST` | `/peopleops/approvals/{id}/action` | Universal approval endpoint; records approver, acting proxy status, and audit comment | `peopleops:manager` | 200 OK |
| `GET` | `/peopleops/team/presence-radar` | Lead retrieves real-time departmental presence (in-office, remote, on-leave, missing punch) | `peopleops:manager` | 200 OK |

### 2.10 Expense Reimbursements & Universal Approval Workflows

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/claims/categories` | List active corporate expense categories with limits and mandatory receipt thresholds | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/claims/categories` | Admin creates custom expense category with policy caps and submission windows | `peopleops:admin` | 201 Created |
| `POST` | `/peopleops/claims/reports` | Employee submits bundled expense claim report with itemized bills and receipts | `peopleops:read` (self) | 201 Created |
| `GET` | `/peopleops/claims/reports/my` | List logged-in employee's submitted expense claims and settlement tracking | `peopleops:read` (self) | 200 OK |
| `GET` | `/peopleops/claims/reports/{id}` | Retrieve full claim details, itemized line items, and invoice attachments | `peopleops:read` | 200 OK |
| `PATCH` | `/peopleops/claims/reports/{id}/manager-review` | Direct lead approves or rejects claim line items for business justification | `peopleops:manager` | 200 OK |
| `PATCH` | `/peopleops/claims/reports/{id}/finance-verify` | Finance reviews corporate tax invoice, validates GST ITC, and assigns settlement rail | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/claims/reports/{id}/instant-disburse` | Finance triggers immediate out-of-cycle direct bank transfer via corporate API | `peopleops:admin` | 200 OK |
| `GET` | `/peopleops/workflows` | List all configured multi-tier approval workflows across entity types | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/workflows` | Create dynamic conditional approval workflow with rule branches and approver steps | `peopleops:admin` | 201 Created |
| `PUT` | `/peopleops/workflows/{id}` | Update workflow rules, value thresholds, approver targets, and SLA timeouts | `peopleops:admin` | 200 OK |
