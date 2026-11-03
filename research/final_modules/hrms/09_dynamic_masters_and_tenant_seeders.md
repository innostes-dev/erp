# HRMS Specification: Dynamic Master Data Architecture & Tenant Seeders Engine

**Document Reference:** `research/final_modules/hrms/09_dynamic_masters_and_tenant_seeders.md`  
**Classification:** Extensible Data Architecture & Configuration Engine  
**Market Benchmark:** Workday Reference Data, Darwinbox Enterprise Masters, Zoho People Custom Picklists  
**Status:** Approved Master Specification  

---

## 1. Executive Summary: Why Hardcoded Enums Fail

A primary point of failure in amateur ERP implementations is hardcoding operational business lists into static database `ENUM` types or application code constants.

* **The Problem:** 
  * Company A organizes engineering into *Frontend*, *Backend*, *DevOps*, and *Platform Core*.
  * Company B operates in hospitality and requires *Culinary Operations*, *Housekeeping*, and *Front Desk*.
  * Company C uses seniority grades `L1` through `L7`, while Company D uses `Junior Associate`, `Senior Consultant`, and `Principal Partner`.
  * If departments, designations, employment types, relationships, or document types are static database `ENUM`s, altering them requires database migrations (`ALTER TYPE ... ADD VALUE`), risking table locks, breaking multi-tenancy isolation, and preventing self-serve customization.
* **The Innostes Solution:**
  * **Dynamic Master Data Management (MDM)**: All business taxonomies are stored in a multi-tenant dynamic lookup table (`hrms_lookup_masters`).
  * **Zero-Touch Tenant Seeders**: Upon tenant creation, an idempotent seeder engine automatically populates a rich baseline of industry-standard master data customized for the tenant's legal jurisdiction (e.g., India vs. US).
  * **Complete Admin Autonomy**: Tenant administrators can add, rename, reorder, or deactivate any master item at any time through the UI (`/hrms/settings/masters`) without developer intervention.
  * **Historical Integrity**: Renaming a master option updates the human-readable label across all active and historical employee records automatically via foreign key or code linkage, while deactivation (`is_active = false`) hides the item from new pickers without corrupting historical payroll or audit logs.

---

## 2. Dual Classification: Immutable State Machines vs. Dynamic Masters

Innostes establishes a strict distinction between what can be a static ENUM and what must be a dynamic tenant master:

```
DATA CLASSIFICATION MATRIX
├── Immutable System State Machines (Native Postgres ENUMs)
│   ├── Employee Lifecycle: DRAFT, INVITED, ONBOARDING, ACTIVE, PROBATION, NOTICE_PERIOD, TERMINATED, ALUMNI
│   ├── Attendance Direction: IN, OUT, BREAK_START, BREAK_END
│   ├── Attendance Normalization: NORMAL, LATE, HALF_DAY, OVERTIME, MISSING_OUT, REGULARIZED
│   ├── Leave Application Status: PENDING, APPROVED, REJECTED, CANCELLED
│   ├── Leave Action Type: ACCRUED, CONSUMED, ENCASHED, LAPSED, REVERSED
│   └── Payroll Stages: DRAFT, CALCULATING, REVIEW, COMMITTED, PAID
│
└── Dynamic Tenant Masters (hrms_lookup_masters Table - 100% Admin Configurable)
    ├── Departments & Sub-Departments
    ├── Designations & Job Titles
    ├── Seniority Grades & Bands (L1-L7, Bands, Custom)
    ├── Employment Contract Types (Permanent, Contract, Intern, Consultant)
    ├── Work Locations & Office Branches
    ├── Academic Qualification Levels & Degree Masters
    ├── Compliance Document Categories & Types
    ├── Family & Nominee Relationship Types
    ├── Blood Groups & Demographic Taxonomies
    ├── Bank Disbursal Modes & Account Types
    └── Cost Centers & Business Units
```

---

## 3. Database Schema: Unified Lookup Masters (`hrms_lookup_masters`)

```sql
-- Dynamic Multi-Tenant Lookup Masters
CREATE TABLE hrms_lookup_masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    category VARCHAR(64) NOT NULL, -- e.g., 'DEPARTMENT', 'DESIGNATION', 'GRADE_BAND'
    code VARCHAR(64) NOT NULL,     -- Unique machine code per category per tenant, e.g. 'DEP_ENG'
    name VARCHAR(255) NOT NULL,    -- Human readable display label, e.g. 'Core Platform Engineering'
    description TEXT,
    parent_id UUID REFERENCES hrms_lookup_masters(id) ON DELETE SET NULL, -- Hierarchical support (e.g. Sub-department)
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,   -- Allows deactivating without deleting historical records
    is_system BOOLEAN NOT NULL DEFAULT FALSE,  -- True if default seed; prevents accidental hard delete
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible metadata (e.g. badge color, cost center code)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_tenant_category_code UNIQUE (tenant_id, category, code)
);

CREATE INDEX idx_hrms_masters_lookup ON hrms_lookup_masters(tenant_id, category, is_active, display_order);
CREATE INDEX idx_hrms_masters_parent ON hrms_lookup_masters(parent_id);

-- Enable Row-Level Security
ALTER TABLE hrms_lookup_masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_masters ON hrms_lookup_masters
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```

---

## 4. Tenant Seeder Engine & Country-Specific Baseline Packs

When a tenant is initialized (via the initial onboarding wizard or organization setup), the system executes an automated, idempotent seeder script:

```
TENANT CREATION EVENT -> Trigger Seeder Engine -> Read Country/Jurisdiction (e.g., 'IN' or 'US')
                                              -> Load Default Master Pack
                                              -> Upsert with is_system = true
```

### 4.1 Standard Master Seed Packs

#### 1. Department Master (`category = 'DEPARTMENT'`)
* `DEP_ENG`: Engineering & Technology
* `DEP_PROD`: Product Management & Design
* `DEP_OPS`: Operations & Logistics
* `DEP_SALES`: Sales & Business Development
* `DEP_MKTG`: Marketing & Growth
* `DEP_FIN`: Finance, Treasury & Accounts
* `DEP_HR`: People Operations & Talent
* `DEP_LEGAL`: Legal, Risk & Compliance

#### 2. Seniority Grade & Band Master (`category = 'GRADE_BAND'`)
* `GRADE_L1`: L1 - Entry / Associate
* `GRADE_L2`: L2 - Intermediate Engineer / Specialist
* `GRADE_L3`: L3 - Senior Engineer / Lead Specialist
* `GRADE_L4`: L4 - Staff / Principal Lead
* `GRADE_L5`: L5 - Senior Staff / Architect
* `GRADE_M1`: M1 - Engineering / Functional Manager
* `GRADE_M2`: M2 - Senior Director / Head of Function
* `GRADE_E1`: E1 - Vice President
* `GRADE_E2`: E2 - Executive Leadership (C-Suite)

#### 3. Employment Contract Type Master (`category = 'EMPLOYMENT_TYPE'`)
* `EMP_PERM_FT`: Permanent Full-Time
* `EMP_PERM_PT`: Permanent Part-Time
* `EMP_CONTRACT`: Fixed-Term Contractor
* `EMP_INTERN`: Intern / Trainee
* `EMP_CONSULT`: Retainer / External Consultant

#### 4. Compliance Document Types (`category = 'DOCUMENT_TYPE'`)
* **India Jurisdiction Seeds:**
  * `DOC_AADHAAR`: Aadhaar Card / Virtual ID Scan
  * `DOC_PAN`: Permanent Account Number (PAN) Card Scan
  * `DOC_PASSPORT`: Passport (Front & Back Pages)
  * `DOC_VOTER_ID`: Election Commission Voter ID
  * `DOC_DRIVING_LICENSE`: Driving License
  * `DOC_BANK_PASSBOOK`: Cancelled Cheque / Bank Passbook
  * `DOC_DEGREE_CERT`: Graduation / Post-Graduation Degree Certificate
  * `DOC_RELIEVING_LETTER`: Previous Employer Relieving & Experience Letter
  * `DOC_PAYSLIP`: Last 3 Months' Salary Slips
  * `DOC_FORM16`: Prior Year Form 16 / Tax Statement
  * `DOC_OFFER_LETTER`: Signed Innostes Offer Letter
* **US Jurisdiction Seeds:**
  * `DOC_US_SSN`: Social Security Card
  * `DOC_US_I9`: Form I-9 Verification Document (Passport / Driver's License)
  * `DOC_US_W4`: Employee's Withholding Certificate (Form W-4)

#### 5. Family & Nominee Relationships (`category = 'FAMILY_RELATIONSHIP'`)
* `REL_SPOUSE`: Spouse (Wife / Husband)
* `REL_SON`: Son
* `REL_DAUGHTER`: Daughter
* `REL_FATHER`: Father
* `REL_MOTHER`: Mother
* `REL_BROTHER`: Brother
* `REL_SISTER`: Sister
* `REL_GUARDIAN`: Legal Guardian

#### 6. Academic Qualification Levels (`category = 'QUALIFICATION_LEVEL'`)
* `QUAL_DOCTORATE`: Doctorate / Ph.D.
* `QUAL_POST_GRAD`: Post Graduate (Master's Degree, M.Tech, MBA, MS)
* `QUAL_UNDER_GRAD`: Under Graduate (Bachelor's Degree, B.Tech, B.E., B.Sc, B.Com)
* `QUAL_DIPLOMA`: Polytechnic / Technical Diploma
* `QUAL_HIGHER_SEC`: Higher Secondary (12th Grade / Pre-University)
* `QUAL_SECONDARY`: Secondary School Certificate (10th Grade / Matriculation)

#### 7. Standard Demographics (`category = 'BLOOD_GROUP'`, `'MARITAL_STATUS'`, `'RESIDENCE_TYPE'`)
* Blood Groups: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`
* Marital Status: `Single`, `Married`, `Divorced`, `Widowed`
* Residence Types: `Rented`, `Owned`, `Company-Provided`, `Parental Home`
* Bank Disbursal Modes: `NEFT`, `RTGS`, `IMPS`, `ACH Corporate Transfer`, `Wire Transfer`, `Company Cheque`

---

## 5. Admin Governance & Lifecycle Rules

Tenant Administrators manage masters through the **Master Data Cockpit** (`/hrms/settings/masters`):

```
+---------------------------------------------------------------------------------------------------+
| INNOSTES MASTER DATA MANAGEMENT | Category: [ Departments (8) ]          [ + Add New Department ] |
+---------------------------------------------------------------------------------------------------+
| CODE       | DISPLAY NAME                    | STATUS   | ACTIONS                                 |
| DEP_ENG    | Engineering & Technology        | [ACTIVE] | [ Edit ] [ Deactivate ]                 |
| DEP_PROD   | Product Management & Design     | [ACTIVE] | [ Edit ] [ Deactivate ]                 |
| DEP_OPS    | Operations & Logistics          | [ACTIVE] | [ Edit ] [ Deactivate ]                 |
| DEP_SALES  | Sales & Business Development    | [ACTIVE] | [ Edit ] [ Deactivate ]                 |
| DEP_FIN    | Finance & Treasury              | [ACTIVE] | [ Edit ] [ Deactivate ]                 |
| DEP_AI     | Artificial Intelligence Labs    | [ACTIVE] | [ Edit ] [ Deactivate ] [ Delete ]      |
+---------------------------------------------------------------------------------------------------+
```

### Governance Rules:
1. **Safety Against Orphaned Records (Soft Deactivation)**:
   * If a tenant admin decides to retire the department `"DEP_OPS"`, they toggle it to `Inactive`.
   * **Result:** All current employees assigned to `"DEP_OPS"` retain their department name on their profile, historical reports, and past payslips. However, `"Operations & Logistics"` is immediately hidden from onboarding dropdowns and new hire forms.
2. **Rename Propagation**:
   * If an admin renames `"Product Management & Design"` to `"Product Strategy & UX"`, the change updates instantaneously across all employee profiles and filter views because records reference the master ID or code.
3. **Deletion Safeguards (`is_system = true`)**:
   * Default seeded items are marked `is_system = true`. Admins can rename or deactivate them, but cannot delete them if foreign key references exist in `hrms_employees` or `hrms_parties`.
   * Custom masters added by the tenant admin (`is_system = false`) can be deleted only if zero active employees are linked to them.

---

## 6. REST OpenAPI 3.1 Endpoints for Master Management

All master endpoints are mounted under `/peopleops/masters` and enforce active tenant validation.

| Method | Path | Summary & Purpose | Scopes Required | Success |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/peopleops/masters` | Query master options filtered by `?category=...&active_only=true` | `peopleops:read` | 200 OK |
| `GET` | `/peopleops/masters/categories` | List all available master categories with counts | `peopleops:read` | 200 OK |
| `POST` | `/peopleops/masters` | Create a new custom master item in a category | `peopleops:admin` | 201 Created |
| `PATCH` | `/peopleops/masters/{id}` | Update master name, description, display order, or active status | `peopleops:admin` | 200 OK |
| `DELETE`| `/peopleops/masters/{id}` | Delete a custom master item (fails with 409 if active references exist) | `peopleops:admin` | 200 OK |
| `POST` | `/peopleops/masters/reseed-defaults` | Re-seed any missing system default masters for the tenant | `peopleops:admin` | 200 OK |

---

## 7. Developer Framework Usage in React / `@innostes/ui`

Client components consume dynamic masters through typed React Query hooks:

```typescript
// Example: Consuming Dynamic Masters in Employee Onboarding Form
import { useMasterOptions } from '@innostes/ui/hooks';

export function DepartmentSelector({ value, onChange }: SelectorProps) {
  const { data: departments, isLoading } = useMasterOptions({
    category: 'DEPARTMENT',
    activeOnly: true,
  });

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Department..." />
      </SelectTrigger>
      <SelectContent>
        {departments?.map((dept) => (
          <SelectItem key={dept.code} value={dept.code}>
            {dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

This guarantees that whenever an administrator alters a master name or adds a custom option, every form, filter drawer, and onboarding stepper across web and mobile updates immediately with zero code changes or deployments.
