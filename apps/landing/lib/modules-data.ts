export interface ModuleFeature {
  title: string;
  description: string;
  technicalDetail: string;
}

export interface ModuleApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
}

export interface ModuleHeadlessApi {
  endpoints: ModuleApiEndpoint[];
  curl: string;
  typescript: string;
  python: string;
  responseJson: string;
}

export interface ModuleStat {
  label: string;
  value: string;
  subtext: string;
}

export interface ModuleData {
  slug: string;
  name: string;
  category: string;
  badge: string;
  tagline: string;
  heroDescription: string;
  previewType: 'kanban' | 'roster' | 'pipeline' | 'ledger' | 'inventory' | 'sprint' | 'wiki';
  stats: ModuleStat[];
  features: ModuleFeature[];
  headlessApi: ModuleHeadlessApi;
  crossModuleWorkflows: string[];
}

export const MODULES_DATA: Record<string, ModuleData> = {
  salesflow: {
    slug: 'salesflow',
    name: 'SalesFlow',
    category: 'Revenue Operations',
    badge: 'Revenue & CRM',
    tagline: 'High-velocity deal pipelines, quote-to-cash, and revenue governance.',
    heroDescription:
      'Manage accounts, track deal stages with automated probability scoring, generate compliant quotes, and forecast revenue without the friction of bloated traditional CRM software.',
    previewType: 'kanban',
    stats: [
      { label: 'Pipeline Velocity', value: '+34%', subtext: 'Average deal cycle acceleration' },
      { label: 'Forecast Accuracy', value: '98.2%', subtext: 'Stage-weighted revenue prediction' },
      { label: 'Integration Overhead', value: '0 ms', subtext: 'Native kernel event routing' },
    ],
    features: [
      {
        title: 'Multi-Stage Deal Pipelines',
        description: 'Visual Kanban pipelines with customizable stages, exit criteria, and automated stage-duration tracking.',
        technicalDetail: 'Stage transitions trigger kernel audit events and update revenue forecasting models automatically.',
      },
      {
        title: 'Quote-to-Cash Automation',
        description: 'Generate itemized pricing quotes from product catalogs and convert approved quotes into accounts receivable.',
        technicalDetail: 'Seamlessly publishes quote approvals to LedgerFlow invoices without third-party webhooks.',
      },
      {
        title: 'Account & Contact Timelines',
        description: 'Complete interaction histories consolidating calls, notes, email threads, and contract revisions in one place.',
        technicalDetail: 'Indexed in PostgreSQL with full-text search and tenant-isolated foreign keys.',
      },
      {
        title: 'Predictive Revenue Forecasting',
        description: 'Real-time visibility into committed, probable, and upside revenue categorized by sales territory or team.',
        technicalDetail: 'Computed on-demand via async database aggregates with sub-10ms query execution.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/salesflow/deals', description: 'List pipeline deals with optional stage and rep filters' },
        { method: 'POST', path: '/salesflow/deals', description: 'Create a new deal with amount, stage, and contact associations' },
        { method: 'PATCH', path: '/salesflow/deals/{id}/stage', description: 'Transition a deal stage with audit delta' },
        { method: 'POST', path: '/salesflow/quotes', description: 'Generate a versioned pricing quote from catalog items' },
      ],
      curl: `curl -X POST https://api.yourdomain.com/salesflow/deals \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Enterprise Operating System License",
    "amount": 75000,
    "stage": "negotiation",
    "probability": 0.85,
    "contact_id": "cnt_9921",
    "expected_close": "2026-12-15"
  }'`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({
  apiKey: process.env.INNOSTES_API_KEY,
  tenantId: 'acme-corp'
});

const deal = await client.salesflow.deals.create({
  title: 'Enterprise Operating System License',
  amount: 75000,
  stage: 'negotiation',
  probability: 0.85,
  contactId: 'cnt_9921',
  expectedClose: '2026-12-15'
});`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c", tenant_id="acme-corp")

deal = client.salesflow.deals.create(
    title="Enterprise Operating System License",
    amount=75000,
    stage="negotiation",
    probability=0.85,
    contact_id="cnt_9921",
    expected_close="2026-12-15",
)`,
      responseJson: `{
  "id": "deal_01jf8b2c",
  "title": "Enterprise Operating System License",
  "amount": 75000.0,
  "stage": "negotiation",
  "probability": 0.85,
  "weighted_value": 63750.0,
  "contact_id": "cnt_9921",
  "expected_close": "2026-12-15T00:00:00Z",
  "created_at": "2026-11-03T00:00:00Z"
}`,
    },
    crossModuleWorkflows: [
      'Approved quotes instantly generate draft invoices in LedgerFlow.',
      'Closed-won deals automatically trigger implementation projects in SprintFlow.',
      'Contract documents and statements of work synchronize directly to DocFlow.',
    ],
  },

  peopleops: {
    slug: 'peopleops',
    name: 'PeopleOps',
    category: 'Workforce & HR',
    badge: 'Workforce & HRMS',
    tagline: 'Modern workforce management, organizational hierarchy, and approval workflows.',
    heroDescription:
      'Manage your global workforce directory, track department hierarchies, automate leave request approvals, and maintain compliance records without spreadsheet sprawl.',
    previewType: 'roster',
    stats: [
      { label: 'Onboarding Time', value: '< 2 Days', subtext: 'From offer acceptance to first day' },
      { label: 'Approval Latency', value: '< 3 Hours', subtext: 'Median manager approval turnaround' },
      { label: 'Data Sovereignty', value: '100%', subtext: 'Employee PII stored in your database' },
    ],
    features: [
      {
        title: 'Global Employee Directory',
        description: 'Centralized employee profiles tracking department, compensation bands, employment type, and reporting lines.',
        technicalDetail: 'Role-Based Access Control restricts salary and identity views to authorized administrators.',
      },
      {
        title: 'Automated Leave Governance',
        description: 'Multi-policy leave accruals, holiday calendars by region, and multi-tier approval chains with notifications.',
        technicalDetail: 'Calculates pro-rated accruals daily and updates team availability indicators across the platform.',
      },
      {
        title: 'Visual Organizational Chart',
        description: 'Interactive tree hierarchy showing reporting relationships, team sizes, and department vacancy counts.',
        technicalDetail: 'Generated dynamically from employee parent-manager relationship keys with zero recursive latency.',
      },
      {
        title: 'Onboarding & Offboarding Checklists',
        description: 'Standardized task templates assigned automatically to IT, HR, and managers upon candidate hire.',
        technicalDetail: 'Emits task events to SprintFlow so IT teams handle hardware provisioning within their existing workflow.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/peopleops/employees', description: 'List employee records with department and status filtering' },
        { method: 'POST', path: '/peopleops/employees', description: 'Onboard a new employee and initialize leave balances' },
        { method: 'POST', path: '/peopleops/leave-requests', description: 'Submit leave request for manager review' },
        { method: 'PATCH', path: '/peopleops/leave-requests/{id}', description: 'Approve or reject leave request with audit trail' },
      ],
      curl: `curl -X GET "https://api.yourdomain.com/peopleops/employees?department=Engineering" \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp"`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({
  apiKey: process.env.INNOSTES_API_KEY,
  tenantId: 'acme-corp'
});

const roster = await client.peopleops.employees.list({
  department: 'Engineering',
  status: 'active'
});`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c", tenant_id="acme-corp")

engineers = client.peopleops.employees.list(
    department="Engineering",
    status="active"
)`,
      responseJson: `{
  "items": [
    {
      "id": "emp_4920",
      "full_name": "Elena Rostova",
      "work_email": "elena.r@acme.corp",
      "department": "Engineering",
      "title": "Lead Platform Architect",
      "manager_id": "emp_1002",
      "joined_at": "2024-03-15"
    }
  ],
  "total": 42
}`,
    },
    crossModuleWorkflows: [
      'New employee profiles automatically grant role-based platform access in the Kernel.',
      'Hired candidates in HireFlow seamlessly convert to active employee records.',
      'Leave absences automatically reflect in SprintFlow sprint capacity planning.',
    ],
  },

  hireflow: {
    slug: 'hireflow',
    name: 'HireFlow',
    category: 'Talent Acquisition',
    badge: 'Recruitment & ATS',
    tagline: 'Structured applicant tracking, candidate pipelines, and scorecard evaluations.',
    heroDescription:
      'Publish job requisitions, track candidates across structured interview stages, collect standardized scorecard evaluations, and make confident hiring decisions.',
    previewType: 'pipeline',
    stats: [
      { label: 'Time-to-Hire', value: '18 Days', subtext: 'Median requisition fulfillment' },
      { label: 'Scorecard Compliance', value: '100%', subtext: 'Blind rubric evaluations before debrief' },
      { label: 'Candidate Privacy', value: 'GDPR/SOC2', subtext: 'Automated resume retention lifecycle' },
    ],
    features: [
      {
        title: 'Visual Candidate Pipelines',
        description: 'Drag-and-drop applicant tracking across application review, technical screen, panel interviews, and offer stages.',
        technicalDetail: 'Stage progression automatically sends notification triggers and schedules interview rounds.',
      },
      {
        title: 'Structured Scorecards & Rubrics',
        description: 'Standardized evaluation rubrics that ensure consistent, unbiased technical and cultural assessments.',
        technicalDetail: 'Scorecard submissions remain blind until all interviewers complete their evaluations.',
      },
      {
        title: 'Automated Resume Indexing',
        description: 'Parse incoming resumes into structured candidate profiles with extracted skills, work history, and education.',
        technicalDetail: 'Processed in private memory without passing candidate data to third-party language models.',
      },
      {
        title: 'Offer Letter Generation',
        description: 'Generate standardized, compensation-compliant offer letters with electronic signature integrations.',
        technicalDetail: 'Validated against approved department budget bands defined in PeopleOps.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/hireflow/jobs', description: 'List open job requisitions' },
        { method: 'POST', path: '/hireflow/candidates', description: 'Submit an applicant profile with resume attachment' },
        { method: 'POST', path: '/hireflow/scorecards', description: 'Record interviewer rubric evaluation' },
      ],
      curl: `curl -X POST https://api.yourdomain.com/hireflow/candidates \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "job_id": "job_arch_01",
    "name": "Marcus Vance",
    "email": "marcus.vance@example.com",
    "source": "referral"
  }'`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({ apiKey: process.env.INNOSTES_API_KEY });
const candidate = await client.hireflow.candidates.create({
  jobId: 'job_arch_01',
  name: 'Marcus Vance',
  email: 'marcus.vance@example.com'
});`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c")
candidate = client.hireflow.candidates.create(
    job_id="job_arch_01",
    name="Marcus Vance",
    email="marcus.vance@example.com"
)`,
      responseJson: `{
  "id": "cand_9102",
  "name": "Marcus Vance",
  "stage": "technical_screen",
  "job_id": "job_arch_01",
  "created_at": "2026-11-03T00:00:00Z"
}`,
    },
    crossModuleWorkflows: [
      'Approved job requisitions pull required headcount from PeopleOps team plans.',
      'Accepted job offers convert directly into employee onboarding workflows.',
    ],
  },

  ledgerflow: {
    slug: 'ledgerflow',
    name: 'LedgerFlow',
    category: 'Finance & Accounting',
    badge: 'General Ledger & Billing',
    tagline: 'Double-entry bookkeeping, multi-currency invoicing, and real-time cash flow.',
    heroDescription:
      'Maintain an immutable general ledger, automate customer invoicing, manage accounts payable and receivable, and generate compliant financial statements with complete audit integrity.',
    previewType: 'ledger',
    stats: [
      { label: 'Reconciliation', value: 'Automated', subtext: 'Bank feed transaction rule matching' },
      { label: 'Audit Trail', value: 'Immutable', subtext: 'Cryptographic SHA-256 ledger chaining' },
      { label: 'Currencies', value: '160+', subtext: 'Real-time FX rate conversions' },
    ],
    features: [
      {
        title: 'Double-Entry General Ledger',
        description: 'Rigorous debit and credit journal entries that ensure balanced financial statements at all times.',
        technicalDetail: 'Transactions are committed atomically; journal imbalances are rejected at the database level.',
      },
      {
        title: 'Multi-Currency Invoicing',
        description: 'Generate compliant tax invoices with customizable line items, payment terms, and automated reminders.',
        technicalDetail: 'Automatically posts accounts receivable debits and sales tax liabilities upon issuance.',
      },
      {
        title: 'Accounts Payable & Expense Approvals',
        description: 'Track vendor bills, capture receipts, and enforce multi-step manager approvals prior to disbursement.',
        technicalDetail: 'Integrates with StockFlow purchase orders for three-way invoice matching.',
      },
      {
        title: 'Financial Statements & Tax Reporting',
        description: 'Generate instant Profit & Loss, Balance Sheet, Cash Flow statements, and sales tax summaries.',
        technicalDetail: 'Calculated dynamically without scheduled batch processing delay.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/ledgerflow/invoices', description: 'List customer invoices with aging metrics' },
        { method: 'POST', path: '/ledgerflow/invoices', description: 'Issue a new customer invoice with line items' },
        { method: 'POST', path: '/ledgerflow/journal-entries', description: 'Post balanced debit/credit journal entry' },
      ],
      curl: `curl -X POST https://api.yourdomain.com/ledgerflow/invoices \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_id": "cust_8820",
    "currency": "USD",
    "items": [
      { "description": "Platform Annual Subscription", "amount": 24000 }
    ]
  }'`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({ apiKey: process.env.INNOSTES_API_KEY });
const invoice = await client.ledgerflow.invoices.create({
  customerId: 'cust_8820',
  currency: 'USD',
  items: [{ description: 'Platform Annual Subscription', amount: 24000 }]
});`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c")
invoice = client.ledgerflow.invoices.create(
    customer_id="cust_8820",
    currency="USD",
    items=[{"description": "Platform Annual Subscription", "amount": 24000}]
)`,
      responseJson: `{
  "id": "inv_2026_091",
  "status": "issued",
  "total_amount": 24000.0,
  "currency": "USD",
  "due_date": "2026-12-03T00:00:00Z"
}`,
    },
    crossModuleWorkflows: [
      'Quotes won in SalesFlow automatically draft customer invoices.',
      'Vendor purchase orders confirmed in StockFlow reconcile against incoming bills.',
    ],
  },

  stockflow: {
    slug: 'stockflow',
    name: 'StockFlow',
    category: 'Inventory & Warehousing',
    badge: 'Inventory & Logistics',
    tagline: 'Multi-warehouse inventory, batch/serial tracking, and purchase order lifecycles.',
    heroDescription:
      'Control physical inventory across multiple storage locations, track stock movements with serial and batch precision, prevent stockouts with automated reordering, and manage vendor purchases.',
    previewType: 'inventory',
    stats: [
      { label: 'Stock Accuracy', value: '99.8%', subtext: 'Barcode scan-verified inventory' },
      { label: 'Reorder Triggers', value: 'Sub-Minute', subtext: 'Automated safety stock calculations' },
      { label: 'Warehouse Support', value: 'Unlimited', subtext: 'Multi-location zone and bin tracking' },
    ],
    features: [
      {
        title: 'Multi-Location Warehouse Management',
        description: 'Track stock balances partitioned across distinct fulfillment centers, regional warehouses, and retail hubs.',
        technicalDetail: 'Enforces location-aware inventory allocation preventing accidental double-commitments.',
      },
      {
        title: 'Batch & Serial Number Traceability',
        description: 'Complete lifecycle auditability for regulated goods, expiration dates, and manufacturing batch numbers.',
        technicalDetail: 'Granular foreign-key relationships preserve tracking from receipt through final shipment.',
      },
      {
        title: 'Purchase Orders & Vendor Catalog',
        description: 'Generate purchase orders based on real-time reorder points and manage vendor lead times and minimum orders.',
        technicalDetail: 'Status transitions trigger receiving dock workflows and accounts payable drafts in LedgerFlow.',
      },
      {
        title: 'Inter-Warehouse Stock Transfers',
        description: 'Manage inventory in-transit between facilities with departure validation and arrival receiving manifests.',
        technicalDetail: 'Maintains transit ledger balances so total organizational stock value remains accurate during transit.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/stockflow/items', description: 'Query inventory items with warehouse quantities' },
        { method: 'POST', path: '/stockflow/transfers', description: 'Initiate stock movement between facilities' },
        { method: 'POST', path: '/stockflow/purchase-orders', description: 'Create purchase order for vendor restock' },
      ],
      curl: `curl -X GET "https://api.yourdomain.com/stockflow/items?sku=SRV-RACK-04" \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp"`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({ apiKey: process.env.INNOSTES_API_KEY });
const item = await client.stockflow.items.get('SRV-RACK-04');`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c")
item = client.stockflow.items.get("SRV-RACK-04")`,
      responseJson: `{
  "sku": "SRV-RACK-04",
  "name": "Server Rack Unit 42U",
  "total_on_hand": 184,
  "warehouses": [
    { "id": "wh_us_east", "quantity": 120 },
    { "id": "wh_eu_central", "quantity": 64 }
  ]
}`,
    },
    crossModuleWorkflows: [
      'Customer quote items in SalesFlow automatically reserve physical inventory.',
      'Purchase order receipts automatically post vendor bills to LedgerFlow.',
    ],
  },

  sprintflow: {
    slug: 'sprintflow',
    name: 'SprintFlow',
    category: 'Agile & Engineering',
    badge: 'Projects & Issues',
    tagline: 'Engineering issue tracking, sprint cadences, customizable Kanban, and roadmaps.',
    heroDescription:
      'Plan releases, manage sprint backlogs, track engineering defects, and align technical execution with company-wide strategic objectives in a distraction-free workspace.',
    previewType: 'sprint',
    stats: [
      { label: 'Issue Load Time', value: '< 15 ms', subtext: 'Sub-second interaction design' },
      { label: 'Keyboard Shortcuts', value: '100%', subtext: 'Full navigation without touching the mouse' },
      { label: 'Git Linkage', value: 'Native', subtext: 'Commit SHA and pull request associations' },
    ],
    features: [
      {
        title: 'Customizable Kanban & Sprint Boards',
        description: 'Flexible workflows matching your engineering methodology: Scrums, continuous delivery, or triage queues.',
        technicalDetail: 'Optimistic UI updates ensure instantaneous drag-and-drop state changes without screen jitter.',
      },
      {
        title: 'Sprint Planning & Velocity Tracking',
        description: 'Story point estimation, sprint backlog grooming, capacity planning, and automated burndown calculations.',
        technicalDetail: 'Integrates with PeopleOps leave schedules to reflect accurate engineer availability.',
      },
      {
        title: 'Defect & Issue Triage',
        description: 'Comprehensive bug reports with reproduction steps, environment tags, severity levels, and stack traces.',
        technicalDetail: 'Link directly to Tracura trace IDs to inspect the exact network request that caused a failure.',
      },
      {
        title: 'Strategic Milestones & Roadmaps',
        description: 'Connect engineering epics to quarterly business milestones for complete transparency across teams.',
        technicalDetail: 'Rolls up completion percentages in real time based on closed child issue points.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/sprintflow/issues', description: 'List active sprint issues by assignee or tag' },
        { method: 'POST', path: '/sprintflow/issues', description: 'Create an engineering issue or bug report' },
        { method: 'PATCH', path: '/sprintflow/issues/{id}/status', description: 'Update issue workflow state' },
      ],
      curl: `curl -X POST https://api.yourdomain.com/sprintflow/issues \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Migrate database connection pool to asyncpg",
    "type": "task",
    "points": 5,
    "priority": "high",
    "sprint_id": "sp_2026_q4_01"
  }'`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({ apiKey: process.env.INNOSTES_API_KEY });
const issue = await client.sprintflow.issues.create({
  title: 'Migrate database connection pool to asyncpg',
  type: 'task',
  points: 5,
  priority: 'high'
});`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c")
issue = client.sprintflow.issues.create(
    title="Migrate database connection pool to asyncpg",
    type="task",
    points=5,
    priority="high"
)`,
      responseJson: `{
  "id": "iss_7718",
  "title": "Migrate database connection pool to asyncpg",
  "status": "in_progress",
  "priority": "high",
  "points": 5,
  "created_at": "2026-11-03T00:00:00Z"
}`,
    },
    crossModuleWorkflows: [
      'Customer implementation commitments in SalesFlow spawn milestone epics in SprintFlow.',
      'Bugs reported in SprintFlow link directly to Tracura network telemetry traces.',
    ],
  },

  docflow: {
    slug: 'docflow',
    name: 'DocFlow',
    category: 'Knowledge Base',
    badge: 'Knowledge & SOPs',
    tagline: 'Living company SOPs, technical documentation, rich markdown, and version control.',
    heroDescription:
      'Organize institutional knowledge, operational playbooks, engineering architecture guidelines, and compliance documentation with real-time collaborative editing and strict version diffing.',
    previewType: 'wiki',
    stats: [
      { label: 'Search Speed', value: '< 8 ms', subtext: 'PostgreSQL full-text inverted index' },
      { label: 'Version Control', value: 'Complete', subtext: 'Immutable history of every edit' },
      { label: 'Formatting', value: 'GFM Markdown', subtext: 'Code blocks, diagrams, and rich tables' },
    ],
    features: [
      {
        title: 'Structured Knowledge Hierarchies',
        description: 'Organize team spaces, company-wide handbooks, and operational SOPs with nested parent-child page trees.',
        technicalDetail: 'Enforces department-level read/write permissions governed by the Kernel RBAC engine.',
      },
      {
        title: 'Collaborative Markdown & Rich Text',
        description: 'Distraction-free editing experience supporting GitHub Flavored Markdown, code syntax highlighting, and tables.',
        technicalDetail: 'Stores documents in semantic Markdown with fast server-side HTML rendering.',
      },
      {
        title: 'Revision History & Visual Diffing',
        description: 'Inspect previous document iterations with line-by-line additions and deletions highlighted clearly.',
        technicalDetail: 'Every document save creates an immutable revision snapshot with author timestamping.',
      },
      {
        title: 'Full-Text Document Search',
        description: 'Find operational SOPs, code standards, or policy documents instantaneously across the entire company wiki.',
        technicalDetail: 'Powered by PostgreSQL tsvector full-text indexing with query ranking.',
      },
    ],
    headlessApi: {
      endpoints: [
        { method: 'GET', path: '/docflow/documents', description: 'Search and query documents across spaces' },
        { method: 'POST', path: '/docflow/documents', description: 'Publish a new markdown operational SOP' },
        { method: 'GET', path: '/docflow/documents/{id}/versions', description: 'Retrieve revision history for a document' },
      ],
      curl: `curl -X GET "https://api.yourdomain.com/docflow/documents?q=onboarding" \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp"`,
      typescript: `import { InnostesClient } from '@innostes/sdk';

const client = new InnostesClient({ apiKey: process.env.INNOSTES_API_KEY });
const docs = await client.docflow.documents.search('onboarding');`,
      python: `from innostes import InnostesClient

client = InnostesClient(api_key="inno_live_sec_8849b2c")
docs = client.docflow.documents.search("onboarding")`,
      responseJson: `{
  "results": [
    {
      "id": "doc_9901",
      "title": "Engineering Onboarding & Architecture Playbook",
      "space": "Engineering",
      "updated_at": "2026-11-01T14:30:00Z"
    }
  ]
}`,
    },
    crossModuleWorkflows: [
      'SprintFlow engineering issues can embed and link directly to DocFlow design specs.',
      'PeopleOps employee onboarding automatically provisions required reading lists.',
    ],
  },
};
