# HRMS Architecture: Heavy Structural Masters vs. Lightweight Picklists & The "Zero-Join" Frontend Pattern

**Document Reference:** `research/final_modules/hrms/09_dynamic_masters_and_tenant_seeders.md`  
**Classification:** Core Data Architecture, Entity Domain Boundaries & Frontend Ergonomics  
**Status:** Approved Architectural Decision  

---

## 1. The Architectural Dilemma: Two Fatal Anti-Patterns

When building extensible Business OS masters, teams commonly fall into one of two traps:

### Anti-Pattern A: The "One True Lookup Table" (OTLT)
Squeezing all master entities (Departments, Locations, Designations, Leave Types, Blood Groups) into a single generic `lookup_masters` table with a `metadata JSONB` column.
* **Why it fails at scale:**
  * Different masters have radically different domain schemas:
    * An **Office Location** has physical coordinates, geofence radius, IP whitelists, city, and timezone.
    * A **Department** has a reporting head of department (`manager_id`), parent department hierarchy, and General Ledger cost centers.
    * A **Leave Type** has accrual rates, carry-forward caps, encashment formulas, and sandwich rule flags.
  * Forcing structural domain entities into a single generic table eliminates database-level referential integrity, destroys foreign key cascades, breaks index performance, and degrades maintainability.

### Anti-Pattern B: The "UUID-Only Foreign Key Hell"
Storing opaque UUIDs (`department_id = "f47ac10b-58cc-4372-a567-0e02b2c3d479"`) in employee records without human-readable context.
* **Why it fails for Frontend & Developers:**
  * **Frontend Join Overhead:** The client cannot simply render `employee.department`. It must fetch all masters, maintain complex client-side hash maps, and resolve UUIDs on every render. If an offline cache is missing, the UI flashes blank or renders ugly UUID strings.
  * **Backend Query Bloat:** Every basic employee query requires 7 to 10 SQL `LEFT JOIN`s (`JOIN departments`, `JOIN designations`, `JOIN locations`, `JOIN contract_types`, `JOIN grade_bands`...), destroying query execution plans on large employee rosters.

---

## 2. The Innostes Architectural Call: Tiered Masters + Hydrated Objects

Innostes resolves both anti-patterns through a **Two-Tier Master Architecture** paired with the **Code-First Machine Key + Hydrated Object Pattern**:

```
MASTER DATA ARCHITECTURE
├── Tier 1: Heavy Structural Domain Tables (Dedicated Relational Schemas)
│   ├── hrms_departments (Hierarchical parent/child, Manager ID, Optional Cost Center)
│   ├── hrms_designations (Pure functional role/title - ZERO pay constraints)
│   ├── hrms_locations (Geofence bounds, Lat/Lng, Timezone, IP subnets)
│   ├── hrms_leave_types (Accrual rate, Carry-forward cap, Encashable flag)
│   └── hrms_salary_components (Component type, Tax rules, Formula DAG)
│
├── Tier 2: Lightweight Dynamic Picklists (hrms_picklists Table)
│   ├── DOCUMENT_TYPE (Aadhaar, PAN, Passport, Cheque, Relieving Letter)
│   ├── FAMILY_RELATIONSHIP (Spouse, Son, Daughter, Father, Mother)
│   ├── QUALIFICATION_LEVEL (Doctorate, Post Graduate, Undergraduate, Diploma)
│   ├── EMPLOYMENT_TYPE (Permanent Full-Time, Part-Time, Contractor, Intern)
│   ├── BLOOD_GROUP (A+, B+, O+, AB+...)
│   └── RESIDENCE_TYPE (Rented, Owned, Parental, Company-Provided)
│
└── The API Contract Pattern: Code-First Natural Keys + Hydrated Objects
    ├── In Database: Stored as clean Machine Codes ('ENG', 'STAFF_ENG', 'BLR_HQ')
    └── In API Payloads: Returned as self-contained { code, name } objects (Zero Frontend Joins!)
```

---

## 3. Tier 1: Heavy Structural Master Tables (DDL)

Entities that possess unique relational behaviors, coordinates, or domain rules reside in dedicated tables:

```sql
-- 1. Departments Master (Hierarchical with Head of Department)
CREATE TABLE hrms_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- Machine code e.g. 'ENG_KERNEL'
    name VARCHAR(255) NOT NULL, -- Human label e.g. 'Core Kernel Systems'
    parent_id UUID REFERENCES hrms_departments(id) ON DELETE SET NULL,
    manager_id UUID, -- References hrms_employees(id)
    cost_center_code VARCHAR(64), -- Completely optional (startups do not use cost centers)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_dept_code UNIQUE (tenant_id, code)
);

-- 2. Designations Master (Pure Functional Titles - Zero Pay Constraints)
CREATE TABLE hrms_designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL, -- e.g. 'STAFF_ENG'
    name VARCHAR(255) NOT NULL, -- e.g. 'Staff Distributed Systems Engineer'
    job_family VARCHAR(64),     -- Optional grouping e.g. 'ENGINEERING'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_desig_code UNIQUE (tenant_id, code)
);

-- 3. Office Locations & Branches Master (Geofencing & Timezone)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_loc_code UNIQUE (tenant_id, code)
);
```

---

## 4. Tier 2: Lightweight Dynamic Picklists (`hrms_picklists`)

For simple single-dimension lists where entities are simply code/name pairs (e.g. document types, family relationships, degree levels):

```sql
CREATE TABLE hrms_picklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'DOCUMENT_TYPE', 'RELATIONSHIP', 'DEGREE_LEVEL', 'EMPLOYMENT_TYPE'
    code VARCHAR(64) NOT NULL,     -- 'DOC_AADHAAR', 'REL_SPOUSE', 'EMP_PERM_FT'
    name VARCHAR(255) NOT NULL,    -- 'Aadhaar Card Scan', 'Spouse', 'Permanent Full-Time'
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE, -- Seed default (prevents accidental hard delete)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_picklist_code UNIQUE (tenant_id, category, code)
);
CREATE INDEX idx_hrms_picklists ON hrms_picklists(tenant_id, category, is_active, display_order);
```

---

## 5. The "Zero-Join" API Contract Pattern: Why Frontend Developers Love It

How do we eliminate both frontend join complexity and heavy database query joins?

### The Storage Layer: Clean Machine Codes
In the database, the employee record stores natural machine codes:
* `department_code = 'ENG_KERNEL'`
* `designation_code = 'STAFF_ENG'`
* `location_code = 'BLR_HQ'`
* `employment_type = 'PERMANENT_FULL_TIME'`

### The Caching & Serialization Layer (In FastAPI Backend)
Because master data is small (less than 100 KB total per tenant) and changes infrequently, the backend maintains an in-memory Redis / local LRU cache of active masters:

$$\text{Cache Key: } \mathtt{tenant:\{id\}:masters} \longrightarrow \mathcal{O}(1) \text{ In-Memory Dictionary}$$

When serializing an employee roster or candidate profile, the backend hydrates `{ code, name }` in **0.01 milliseconds in Python memory**. It does **NOT** run 10 SQL `JOIN`s in PostgreSQL!

### The Outbound JSON Response Received by Frontend:
```json
{
  "id": "c71a39f1-9b22-4a0b-8d5f-1491763ef801",
  "employee_code": "INN-00104",
  "legal_name": "Jane Doe",
  "department": {
    "code": "ENG_KERNEL",
    "name": "Core Kernel Systems"
  },
  "designation": {
    "code": "STAFF_ENG",
    "name": "Staff Distributed Systems Engineer",
    "grade_band": "L5"
  },
  "location": {
    "code": "BLR_HQ",
    "name": "Bengaluru Tech Park HQ",
    "timezone": "Asia/Kolkata"
  },
  "employment_type": {
    "code": "PERMANENT_FULL_TIME",
    "name": "Permanent Full-Time"
  }
}
```

### The Huge Wins for Frontend UI:
1. **Zero Client-Side Lookups:**
   ```tsx
   // Direct, clean rendering without joins or ID maps:
   <span>{employee.department.name}</span>
   <Badge>{employee.designation.name}</Badge>
   ```
2. **Effortless Conditional Logic:**
   ```tsx
   // No checking cryptic UUIDs. Developers write clean, readable code:
   if (employee.employment_type.code === 'CONTRACTOR') {
     renderContractorInvoicingTab();
   }
   ```
3. **Instant Filter Dropdowns:**
   The frontend simply calls `GET /peopleops/masters/departments` and maps `<Option value={dept.code}>{dept.name}</Option>`.

---

## 6. How Admin Changes Propagate (Rename vs. Deactivate)

What happens when an Administrator customizes a master item?

| Action by Admin | Technical Execution | Impact on Active & Historical Employees |
| :--- | :--- | :--- |
| **Renaming an Item**<br/>(e.g., Change *"Product Management"* to *"Product Strategy & Design"*)| The admin updates `name` in `hrms_departments`. The in-memory cache is invalidated instantly. | **Instant Zero-Migration Update:** Because employees reference the code `PROD`, all active employee profiles, past payroll summaries, and filter drawers immediately render the updated name *"Product Strategy & Design"*. |
| **Adding a New Department**<br/>(e.g., Admin adds *"AI Labs"*)| Admin inserts a new record with code `AI_LABS`. | Immediately available in all candidate onboarding pickers and employee assignment dropdowns. |
| **Retiring an Item (Deactivation)**<br/>(e.g., Admin discontinues *"Operations"*)| Admin toggles `is_active = false`. | **Safe Retirement:** Existing employees assigned to `"Operations"` retain their department name on their profile and historical tax reports. However, `"Operations"` is automatically hidden from new hire forms and candidate onboarding steps. |
| **Modifying a Code Key**<br/>(Rare administrative refactor)| Postgres foreign key enforces `ON UPDATE CASCADE`: `FOREIGN KEY (tenant_id, department_code) REFERENCES hrms_departments(tenant_id, code) ON UPDATE CASCADE`. | The database automatically cascades the updated code across all referencing employee rows atomically. |

---

## 7. Tenant Seeder Engine (Default Jurisdiction Packs)

When a tenant registers or initializes PeopleOps, the seeder automatically populates both Tier 1 structural tables and Tier 2 picklists:

```
TENANT CREATION
   │
   ├── 1. Populates hrms_departments (8 Default Functional Departments)
   ├── 2. Populates hrms_designations (12 Standard Hierarchy Roles: L1 to E2)
   ├── 3. Populates hrms_locations (Primary HQ branch based on tenant registration address)
   ├── 4. Populates hrms_leave_types (Casual, Sick, Privilege / Earned Leaves)
   └── 5. Populates hrms_picklists (Document Types, Relationships, Education Levels, Blood Groups)
```

The tenant starts on Day 1 with an out-of-the-box working system, with zero mandatory configuration required, while enjoying complete freedom to customize any master as their organization matures.
