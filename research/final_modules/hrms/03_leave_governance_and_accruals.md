# HRMS Specification: Leave Governance, Accrual Engines & Modular Policy Configuration

**Document Reference:** `research/final_modules/hrms/03_leave_governance_and_accruals.md`  
**Classification:** Core Time-Off Engine, Statutory Compliance & Enterprise Policy Matrix  
**Status:** Canonical Implementation Specification  

---

## 1. Architectural Philosophy: 100% Admin-Configurable Time-Off

In Innostes Business OS, leave management is not a hardcoded set of rules. It is an **extensible, multi-dimensional policy engine**. Every organization—from a 10-person remote software startup with Unlimited PTO to a 5,000-employee manufacturing enterprise governed by the Factories Act—can configure its time-off policies without writing code or requesting database migrations.

### The Core Law of Innostes Leave Governance
1. **Zero Hardcoded Quotas (Startup Total Freedom)**:
   * **Casual Leave is NOT fixed at 12 days.** Standard seed values (like 12 days CL or 18 days PL) are merely initial suggested templates for traditional statutory companies.
   * Startups have 100% freedom to customize any quota: set Casual Leave to 6 days, 8 days, 15 days, or 24 days.
   * Startups can completely bypass traditional categories and create a single unified **`PTO` (Paid Time Off)** bucket (e.g. 20 or 25 days/year) that employees use for vacation, personal, or sick days without micromanagement.
   * Startups can enable **Unlimited Trust-First PTO** with a single toggle.
2. **Dynamic Master-Driven Leave Types**: Administrators define, rename, or delete leave types (`CL`, `SL`, `PL`, `PTO`, `WELLNESS`, `MATERNITY`, `COMP_OFF`, etc.) via the visual Admin Settings UI.
3. **Modular 8-Dimension Policy Configuration**: Every leave type has an independent set of rules controlling accruals, carry-forwards, encashment, sandwich treatment, probation eligibility, and approval flows.
4. **Immutable Double-Entry Leave Ledger**: Leave balances are never stored as mutable numbers directly on employee records. Every credit, consumption, encashment, and lapse is an append-only ledger transaction (`hrms_leave_ledger`).

---

## 2. Startup Presets vs. Traditional Enterprise Leave Catalogs

When an administrator sets up time-off in **Settings > Leave Policies**, Innostes does not force them into an enterprise bureaucracy. The system presents 4 distinct operational archetypes:

```
LEAVE POLICY ARCHETYPES (CHOOSE ON DAY 1 — FULLY CUSTOMIZABLE AT ANY TIME)
├── 1. The Modern Remote Startup (Unlimited PTO)
│      └── Zero quota math, zero balance liability, trust-first lead notification.
│
├── 2. The Flexible Tech Startup (Unified PTO Bank — e.g. 20 Days)
│      └── Single bucket of 20 days (customizable). Covers vacation, personal, and sick time without policing.
│
├── 3. The Traditional Statutory Structure (Separated Buckets)
│      └── Casual Leave (e.g. 10–12d), Sick Leave (e.g. 10–12d), Privilege Leave (e.g. 15–18d).
│
└── 4. 100% Custom Blank Slate
       └── Create your own policy names, quotas (e.g. 8 days "Wellness", 14 days "Personal"), and custom rules.
```

### The Standard Seed Catalog (Customizable Reference Defaults)

The Innostes seed engine provides ready-to-use policy templates aligned with Indian and international statutory standards, while giving admins full freedom to edit every single number:

| Leave Type Code | Human Label | Standard Accrual Model | Carry-Forward Default | Encashable | Statutory Alignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PL` / `EL`** | Privilege / Earned Leave | Monthly Pro-Rata (1.5 to 1.75 days/mo) | Capped (max 30 or 45 days rollover) | Yes (Exit / Annual Window) | Factories Act / Shops & Establishments Act |
| **`CL`** | Casual Leave | Annual Lump-Sum (e.g., 12 days on Jan 1st) | Zero rollover (lapses Dec 31st) | No | Non-encashable personal unplanned time |
| **`SL`** | Sick / Medical Leave | Annual Lump-Sum or Monthly Pro-Rata | Capped or Lapse (Admin setting) | No | Medical cert mandatory if $> 2$ days |
| **`MATERNITY`** | Statutory Maternity Leave | Event-Triggered (26 weeks / 182 days) | Fixed event duration | No | Maternity Benefit Act, 1961 |
| **`PATERNITY`** | Paternity Leave | Event-Triggered (1 to 2 weeks) | Must consume within 6 months of childbirth | No | Company policy / State norms |
| **`COMP_OFF`** | Compensatory Off | Earned by working weekend/holiday punch | Expires in 60 or 90 days from punch | No | Overtime compensation compliance |
| **`BEREAVEMENT`**| Bereavement / Compassionate | Event-Triggered (3 to 7 days) | Immediate event consumption | No | Compassionate leave policy |
| **`MARRIAGE`** | Marriage Leave | Event-Triggered (3 to 5 days) | 1-time grant for first marriage | No | Company milestone benefit |
| **`FLOATING`** | Floating / Optional Holiday | Lump-Sum (e.g., choose 2 from 8 festivals) | Lapses Dec 31st | No | Cultural & regional diversity inclusion |
| **`SABBATICAL`** | Study / Extended Sabbatical | Application-Driven (1 to 12 months) | N/A | No | Seniority & tenure-gated policy |
| **`UNPAID_LOP`** | Loss of Pay (Unpaid Leave) | Unlimited upon manager sign-off | N/A | N/A | Salary deduction in Payroll Engine |

---

## 3. The 8 Modular Policy Dimensions (Admin Configuration Matrix)

When an administrator navigates to **Settings > Leave Policies > Create/Edit Leave Type**, the system exposes an intuitive 4-tab policy builder covering 8 distinct operational dimensions:

```mermaid
flowchart TD
    LT["Leave Type Configuration"]
    LT --> D1["1. Quota & Accrual Engine<br/>(Lump-sum vs Monthly, Proration, Unlimited PTO)"]
    LT --> D2["2. Carry-Forward & Expiry Rules<br/>(Rollover Cap, Expiry Window, Year-End Lapse)"]
    LT --> D3["3. Financial Encashment Rules<br/>(Severance vs Annual Payout, Basic vs Gross)"]
    LT --> D4["4. Booking & Application Constraints<br/>(Half-day, Notice period, Consecutive limits, Backdating)"]
    LT --> D5["5. Weekend & Holiday Treatment<br/>(Sandwich rule, Calendar vs Working days)"]
    LT --> D6["6. Lifecycle Eligibility<br/>(Probation access, Notice period rules)"]
    LT --> D7["7. Demographic & Contract Targeting<br/>(Gender, Marital status, Contract type)"]
    LT --> D8["8. Approval Routing & SLAs<br/>(Auto-approve, 1-click Lead, Multi-tier, HR sign-off)"]
```

---

### Dimension 1: Quota, Accrual Engine & Proration
The administrator determines how and when employees receive time-off credits:

* **Accrual Models**:
  * **`ANNUAL_LUMP_SUM`**: The full annual quota is credited upfront on the first day of the cycle (e.g. 12 days on Jan 1st or Apr 1st).
  * **`MONTHLY_PRO_RATA`**: Quota is divided across 12 months and credited automatically on the 1st of each month (e.g. $18 \div 12 = 1.5$ days/month).
  * **`QUARTERLY`**: Credited in 4 equal quarterly installments.
  * **`UNLIMITED_PTO`**: Quota tracking is disabled. Output-driven startups grant trust-first time-off without tracking leave banks.
  * **`EVENT_BASED`**: No scheduled accrual. Granted manually or upon life-event declaration (e.g. Maternity, Bereavement).
* **Accrual Timing**:
  * `BEGINNING_OF_PERIOD`: Advance credit (employee can use days starting on the 1st).
  * `END_OF_PERIOD`: Earned credit (employee earns days after completing the month).
* **New Joiner Proration Formulas**:
  * `EXACT_DAYS`:
    $$\text{Prorated Days} = \text{Annual Quota} \times \left( \frac{\text{Days Remaining in Cycle}}{\text{Total Days in Cycle}} \right)$$
  * `MID_MONTH_CUTOFF`: If joined on or before the 15th, full monthly credit; if joined after the 15th, 0.5 month credit.
  * `NONE`: Full annual quota granted regardless of join date.
* **Rounding Invariant**: Prorated balances round to the nearest half-day ($0.5$ or $1.0$).

---

### Dimension 2: Carry-Forward, Rollover & Expiry Rules
What happens to unused leave when the calendar or financial year ends?

```
YEAR-END BALANCE EVALUATION PIPELINE
Unused Balance at Cycle Cutoff
   │
   ├── Can Carry Forward = FALSE ──> Entire Unused Balance Lapses (LAPSED in Ledger)
   │
   └── Can Carry Forward = TRUE
         │
         ├── Up to Carry-Forward Cap (e.g. 30 Days) ──> Transferred to New Year (ACCRUED)
         │     │
         │     └── Carry-Forward Expiry Window (e.g. 90 Days)
         │           └── Must be consumed before 31 March, or expires
         │
         └── Excess Balance Above Cap
               ├── Is Encashable = TRUE  ──> Converted to Payroll Cash Payout
               └── Is Encashable = FALSE ──> Excess Days Permanently Lapsed
```

* **`can_carry_forward`** (`true / false`): Master toggle for balance rollover.
* **`carry_forward_cap`** (e.g. `30.0 days`): Maximum days an employee can carry into the next cycle. Any days beyond this cap are either encashed or lapsed.
* **`carry_forward_expiry_months`** (e.g. `3 months` / `90 days`): If set, carried-forward days must be consumed within this window (e.g. by March 31st), or the system automatically posts a `LAPSED` transaction.

---

### Dimension 3: Financial Encashment Rules
Allows organizations to monetize unused leave balances either at year-end or during employee offboarding:

* **`is_encashable`** (`true / false`): Master toggle allowing financial liquidation.
* **`encashment_mode`**:
  * `UPON_SEPARATION_ONLY`: Encashed strictly during Full & Final (F&F) settlement when leaving the company.
  * `ANNUAL_WINDOW`: Employees can liquidate excess leave during an annual December/March payroll window.
  * `ON_DEMAND`: Employees can request leave encashment at any time subject to HR approval.
* **`encashment_min_balance_retained`**: Minimum days that must remain in the employee's bank (e.g. must maintain at least 15 days of PL; only excess can be encashed).
* **`encashment_max_days_per_year`**: Maximum days eligible for encashment in a single year (e.g. max 10 days).
* **`encashment_salary_basis`**:
  * `BASIC_SALARY` (Statutory Standard): $\text{Per Day Rate} = \frac{\text{Monthly Basic Salary}}{26 \text{ or } 30}$
  * `GROSS_SALARY`: Computed on total gross earnings excluding variable bonuses.

---

### Dimension 4: Booking & Application Constraints
Rules to prevent operational disruption, staffing shortages, and fraudulent backdating:

* **Half-Day Booking**:
  * `allow_half_day` (`true / false`): When enabled, employees can apply for `FIRST_HALF` (morning) or `SECOND_HALF` (afternoon) taking $0.5$ days.
* **Advance Notice Requirement**:
  * `min_notice_days` (e.g. `7 days` for planned PL, `0 days` for emergency Sick Leave).
* **Maximum Consecutive Days**:
  * `max_consecutive_days` (e.g. max 3 days for Casual Leave; longer durations require Privilege Leave or HR review).
* **Backdated Application (Past-Dating)**:
  * `allow_past_dating` (`true / false`): Can an employee apply for leave after taking it?
  * `max_past_days` (e.g. max 3 days for Sick Leave; 0 days for Casual Leave).
* **Overdraft & Negative Balance**:
  * `allow_negative_balance` (`true / false`): Can employees borrow from future monthly accruals?
  * `max_negative_days` (e.g. up to `-3.0` days). Negative balances are settled against subsequent monthly credits or deducted from payroll if the employee exits.
* **Mandatory Documentation & Attachments**:
  * `requires_attachment` (`true / false`).
  * `attachment_mandatory_above_days` (e.g. if Sick Leave $> 2$ consecutive days, medical certificate upload is **mandatory** before submission).

---

### Dimension 5: Weekend & Holiday Treatment (Sandwich Rule Engine)
Governs how weekly rest days (Saturdays/Sundays) and declared public holidays are counted when falling within or adjacent to a leave period:

| Setting Key | Startup Default | Legacy Enterprise Option | Explanation |
| :--- | :--- | :--- | :--- |
| `include_weekends` | `false` | `true` | When `false`, taking a full week off (Mon to Fri) deducts **5 days**, not 7. |
| `include_holidays` | `false` | `true` | When `false`, a public holiday falling on Wednesday during a week-long leave is not deducted. |
| `sandwich_rule_mode` | `DISABLED` | `SANDWICH_WEEKENDS` or `SANDWICH_ALL` | When enabled, taking Friday and Monday off automatically converts the intervening Saturday and Sunday into deducted leave days. |

#### Detailed Sandwich Rule Formulations:
* **`DISABLED` (Innostes Modern Default)**:
  $$\text{Leave on Friday} + \text{Leave on Monday} \implies \text{Total Deducted} = \mathbf{2.0 \text{ Days}}$$
* **`SANDWICH_WEEKENDS` (Legacy Manufacturing / Strict Corporate)**:
  $$\text{Leave on Friday} + \text{Weekend (Sat+Sun)} + \text{Leave on Monday} \implies \text{Total Deducted} = \mathbf{4.0 \text{ Days}}$$
* **Transparent UI Display**: When the sandwich rule triggers, the application modal explicitly warns the employee:
  > *"Sandwich Rule Applied: Your leave spans Friday and Monday. Saturday and Sunday (2 days) have been included in your deduction. Total days deducted: 4.0."*

---

### Dimension 6: Life-Cycle Eligibility (Probation & Notice Period)
How does an employee's employment stage restrict leave availability?

* **Probation Governance (`probation_rule`)**:
  * `FULL_ACCESS`: Available from Day 1 (equal treatment).
  * `ACCRUE_ONLY_LOCKED`: Leaves accrue monthly in the background, but balance is locked and cannot be applied until the employee passes probation.
  * `LOSS_OF_PAY_ONLY`: Any absence during probation is treated as unpaid Loss of Pay.
* **Notice Period Governance (`notice_period_rule`)**:
  * `PROHIBITED`: Employees serving their notice period cannot apply for leave.
  * `MANAGER_DISCRETION`: Manager can approve in exceptional situations.
  * `EXTENDS_NOTICE_PERIOD`: Taking 1 day of leave during notice period automatically shifts the employee's Last Working Day (LWD) forward by 1 day.

---

### Dimension 7: Demographic & Contract Targeting
Restricts leave types to appropriate employee cohorts:

* **Gender Targeting (`applicable_gender`)**:
  * `ALL` (Standard for CL, SL, PL)
  * `FEMALE_ONLY` (Maternity Leave)
  * `MALE_ONLY` (Paternity Leave)
* **Marital Status Targeting (`applicable_marital_status`)**:
  * `ALL` vs `MARRIED_ONLY` (Childcare / Family Leave) vs `UNMARRIED_ONLY` (Marriage Leave)
* **Employment Type Targeting (`applicable_employment_types`)**:
  * Array of codes: `['PERMANENT_FULL_TIME', 'PERMANENT_PART_TIME']`. Excludes short-term interns or ad-hoc contractors who do not accrue statutory paid leave.

---

### Dimension 8: Approval Routing, Absence Delegation & Auto-Escalation Engine

A critical challenge in team management is preventing approval bottlenecks when a team lead or reporting manager is absent, without overwhelming senior executives (2nd-line managers / directors) with daily low-level notifications when the lead is present.

Innostes resolves this with the **3-Tier Presence-Aware Delegation & Escalation Architecture**:

```mermaid
flowchart TD
    Submit["Team Member Submits Request<br/>(Leave / Missing Punch / Timesheet)"] --> LeadCheck{"Is Direct Lead Present at Work Today?"}
    
    LeadCheck -->|Lead is Present / Active| LeadQueue["Routes Directly to Lead's 'Team View' Inbox<br/>(2nd-Line Manager does NOT see it — Zero Inbox Noise)"]
    
    LeadCheck -->|Lead is On Leave / OOO| DelCheck{"Did Lead Configure an OOO Proxy Delegation?"}
    
    DelCheck -->|Yes: Proxy Assigned| ProxyQueue["Routes to Designated Peer Lead / Proxy<br/>(Badge: 'Acting Approver for Lead')"]
    DelCheck -->|No: Sudden Unplanned Sickness| AutoFallback["Presence-Aware Fallback:<br/>Routes Automatically to 2nd-Line Manager<br/>Badge: 'Acting Approver: Lead Sarah Chen is On Leave'"]
    
    LeadQueue --> SLACheck{"SLA Expired? (>48h or 24h before Payroll Freeze)"}
    SLACheck -->|Yes: Inactive Lead| AutoEscalate["Auto-Escalate to 2nd-Line Manager<br/>(Urgent ping to Lead & Director)"]
    SLACheck -->|No| LeadQueue
```

---

#### 1. Why Naive Second-Line Routing Fails (And How Innostes Fixes It)

* **The Anti-Pattern (Always Routing to 2nd-Line Manager)**:
  * If a Director with 5 Leads and 40 engineers receives every daily leave application and missing punch regularization, they suffer **Inbox Fatigue**. They cannot discern urgent issues from routine sign-offs, and lack the sprint-level pairing context to make informed decisions.
  * Bypassing the direct lead while they are present undermines team autonomy and operational ownership.
* **The Innostes Principle (Presence-Gated Visibility)**:
  * By default, the 2nd-Line Manager's queue is completely clean of direct reports' daily requests.
  * The 2nd-Line Manager only sees requests when:
    1. The primary lead has formally delegated authority during an approved leave, OR
    2. The primary lead is detected by the attendance engine as `ON_LEAVE` / `ABSENT` today (automatic safety net), OR
    3. The request exceeds the 48-hour SLA or approaches the monthly payroll lock.

---

#### 2. The 3 Pillars of Absence Governance

##### Pillar 1: Proactive Out of Office (OOO) Approval Delegation (Planned Leave)
* When a Lead applies for leave or activates OOO status in their **Team View**:
* A delegation modal prompts:
  > *"You have 6 direct reports. Who should handle approvals while you are away?"*
  * **Option A**: **Escalate to My Direct Manager (2nd-Line Manager)** (Default).
  * **Option B**: **Delegate to a Lateral Peer Lead** (e.g. Lead of Infrastructure Team).
* **Strict Date Bounds**: The delegation is active strictly between `start_date` and `end_date` of the lead's leave. The moment the lead checks in or the leave expires, proxy authority instantly revokes.
* **Granular Scope Toggles**:
  * `[✓] Leave Applications & Cancellations`
  * `[✓] Attendance Punch Regularizations & Comp-Off Grants`
  * `[✓] Monthly Timesheet Sign-Offs`
  * `[ ] Sensitive Salary Advance / Expense Claims` (Retained for lead's return or escalated directly to Finance).

##### Pillar 2: Presence-Aware Automatic Fallback (Unplanned / Emergency Absence)
* If a lead suffers a sudden medical emergency, accident, or takes unplanned sick leave without configuring a proxy:
* The workflow engine evaluates the lead's daily attendance record:
  * If the lead is marked `ON_LEAVE` (approved Sick Leave) or has an unexcused absence today:
  * The pending requests automatically surface on the **2nd-Line Manager's Team View** with an actionable badge:
    `[Acting Approver: Primary Lead Sarah Chen is On Leave (Sick)]`.
  * The 2nd-Line Manager can approve or reject immediately, preventing sprint paralysis.
  * The moment Sarah returns to work, unapproved items return exclusively to Sarah's queue.

##### Pillar 3: Auto-Escalation SLA (Inactivity & Payroll Cutoff Triggers)
* If a lead is present at work but fails to act on a pending request within **48 hours**:
  * An automated notification pings the lead.
  * If still unresolved at **72 hours**, the task auto-escalates to the 2nd-Line Manager with an `[Escalated - SLA Exceeded]` tag.
* **Payroll Pre-Flight Lock Trigger**:
  * Regardless of hours elapsed, **24 hours before the monthly Attendance & LOP Freeze**, all unapproved requests across the company auto-escalate to 2nd-Line Managers and HR Admins to prevent payroll calculation delays.

---

#### 3. Complete Cryptographic Audit Trail
Every approval action permanently records the exact context in the database ledger:
* `approved_by_id`: `UUID` of the actual person who clicked Approve.
* `acting_for_id`: `UUID` of the primary lead (NULL if approved directly by lead).
* `delegation_type`: `DIRECT_LEAD`, `OOO_PROXY`, `PRESENCE_FALLBACK`, or `SLA_ESCALATION`.
* `audit_comment`: e.g. *"Approved by Keshav Iyer on behalf of Sarah Chen [Reason: Primary Lead on Approved Sick Leave]"*.

---

## 4. The Compensatory Off (Comp-Off) Generator Engine

Compensatory Off is not accrued on a schedule. It is **earned dynamically** when an employee performs approved work on a declared weekly off (Saturday/Sunday) or public holiday:

```mermaid
flowchart TD
    Punch["Employee clocks in on Weekend / Public Holiday"] --> DurationCheck{"Total Verified Hours Worked?"}
    
    DurationCheck -->|< 4 Hours| NoCredit["No Comp-Off Credited<br/>(Informational Attendance Log Only)"]
    DurationCheck -->|4.0h to 7.9h| HalfComp["Eligible for 0.5 Comp-Off Day"]
    DurationCheck -->|>= 8.0 Hours| FullComp["Eligible for 1.0 Comp-Off Day"]
    
    HalfComp --> LeadSignOff{"Reporting Lead Approves Overtime?"}
    FullComp --> LeadSignOff
    
    LeadSignOff -->|Approved| Grant["Ledger Action: ACCRUED (+1.0 Comp-Off)<br/>Expires in 60 Days"]
    LeadSignOff -->|Rejected| Deny["Comp-Off Denied with Manager Note"]
```

* **Validity & Expiry Engine**: Every Comp-Off grant carries an `expires_at` timestamp (default: 60 or 90 days from the work date). If unused by that date, the daily balance closure cron issues an automatic `LAPSED` transaction.

---

## 5. The Immutable Leave Ledger Specification

Leave balances are governed by the **Double-Entry Ledger Principle**. The application never runs: `UPDATE employees SET leave_balance = leave_balance - 1`. Such mutations destroy auditability and make retrospective error diagnosis impossible.

### Dynamic Balance Calculation
An employee's real-time balance for any leave type is always derived:

$$\text{Current Available Balance} = \sum_{t \in \text{Ledger}} \text{transaction\_days}(t) - \sum_{a \in \text{Pending Applications}} \text{requested\_days}(a)$$

### Ledger Action Codes (`leave_action`)

| Ledger Action | Sign | Trigger Description |
| :--- | :--- | :--- |
| **`ACCRUED`** | **$+$** | Automated monthly/annual accrual cron or approved Comp-Off grant |
| **`CONSUMED`** | **$-$** | Deduction triggered upon manager approval of a leave application |
| **`ENCASHED`** | **$-$** | Balance liquidated for financial payout in Payroll |
| **`LAPSED`** | **$-$** | Expired unused balance at year-end or expired Comp-Off |
| **`REVERSED`** | **$+$** | Reversal of consumed leave when an approved leave is subsequently cancelled |
| **`ADJUSTED`** | **$\pm$** | Manual administrative correction with mandatory HR audit reason note |

---

## 6. Real-Time Application Sanity & Sandwich Preview

When an employee opens the leave application modal:
1. **Live Ledger Balance Check**: Displays available balance, pending requests, and post-deduction balance.
2. **Real-Time Calendar Radar**: Highlights weekends, declared public holidays, and existing approved leaves of team members.
3. **Instant Sandwich Warning**: If the selected dates trigger a sandwich rule, the modal visually updates the day counter before submission:
   * *"Base Days: 2.0 (Fri, Mon) + Sandwich Rest Days: 2.0 (Sat, Sun) = Total Deduction: 4.0 Days."*
4. **Zero-Knowledge Manager Routing**: The employee does not pick their approver. The request automatically routes to their active `manager_id`. If `manager_id` is null, it falls back to the Organization HR Administrator.

---

## 7. Startup-First Mode: Single-Toggle Unlimited PTO

For modern early-stage startups (5 to 30 engineers) that find traditional leave banks and accrual formulas bureaucratic, the entire leave system can be converted to **Unlimited PTO** in 1 click:

In **Company Settings > Leave Configuration**:
```
[✓] Enable Unlimited Trust-First PTO
    (When enabled, all annual quotas, accrual cron jobs, carry-forward caps, 
     and sandwich rules are bypassed. Employees simply notify their lead 
     when taking time off. Attendance calendar tracks presence without deducting leave banks.)
```

When Unlimited PTO is active:
* Employees submit dates so the team knows they are away.
* Line managers approve for scheduling transparency.
* Zero balance math, zero encashment liabilities on the company balance sheet, and zero administrative overhead.
