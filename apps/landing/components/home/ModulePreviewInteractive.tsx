'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  DollarSign,
  FileText,
  FolderGit2,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

interface ModulePreviewProps {
  type: 'kanban' | 'roster' | 'pipeline' | 'ledger' | 'inventory' | 'sprint' | 'wiki';
}

export function ModulePreviewInteractive({ type }: ModulePreviewProps) {
  const [activeTab, setActiveTab] = useState<'ui' | 'api'>('ui');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-2xl">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between border-b border-fd-border bg-fd-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-500/80" />
            <span className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-xs text-fd-muted-foreground">
            innostes://{type}.workspace
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-fd-border bg-fd-background p-0.5">
          <button
            onClick={() => setActiveTab('ui')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'ui'
                ? 'bg-fd-accent text-fd-accent-foreground shadow-sm'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            Turnkey UI View
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'api'
                ? 'bg-fd-accent text-fd-accent-foreground shadow-sm'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            <Code2 className="size-3.5" />
            Headless API
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 md:p-6">
        {activeTab === 'ui' ? (
          <div>
            {type === 'kanban' && <SalesFlowKanbanPreview />}
            {type === 'roster' && <PeopleOpsRosterPreview />}
            {type === 'pipeline' && <HireFlowPipelinePreview />}
            {type === 'ledger' && <LedgerFlowLedgerPreview />}
            {type === 'inventory' && <StockFlowInventoryPreview />}
            {type === 'sprint' && <SprintFlowSprintPreview />}
            {type === 'wiki' && <DocFlowWikiPreview />}
          </div>
        ) : (
          <div className="rounded-xl border border-fd-border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 dark:bg-black">
            <div className="mb-3 flex items-center justify-between text-zinc-400">
              <span>Standard REST OpenAPI 3.1 Spec (Decoupled Backend)</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `curl -X GET https://api.yourdomain.com/${type} -H "X-Tenant-ID: acme" -H "Authorization: Bearer inno_key"`
                  )
                }
                className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300 hover:text-white"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copied ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-zinc-300">
              <code>{`# Query live records from the decoupled ${type} engine
curl -X GET "https://api.yourdomain.com/${type}/records" \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json"

# Response: 200 OK
{
  "tenant_id": "acme-corp",
  "module": "${type}",
  "status": "synchronized",
  "records_count": 142,
  "head_latency_ms": 1.2
}`}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function SalesFlowKanbanPreview() {
  const columns = [
    {
      title: 'Qualified',
      count: 3,
      amount: '$145,000',
      items: [
        { title: 'Vanguard Systems Upgrade', value: '$85,000', rep: 'Marcus V.', prob: '60%' },
        { title: 'HyperScale Cloud Migration', value: '$60,000', rep: 'Elena R.', prob: '50%' },
      ],
    },
    {
      title: 'Negotiation',
      count: 2,
      amount: '$210,000',
      items: [
        { title: 'Acme Global Business OS License', value: '$135,000', rep: 'Marcus V.', prob: '85%' },
        { title: 'Apex FinTech Telemetry Cluster', value: '$75,000', rep: 'Sarah K.', prob: '90%' },
      ],
    },
    {
      title: 'Closed / Won',
      count: 4,
      amount: '$340,000',
      items: [
        { title: 'OmniCorp Multi-Tenant Rollout', value: '$190,000', rep: 'Sarah K.', prob: '100%' },
        { title: 'Nexus Logistics StackFlow Sync', value: '$150,000', rep: 'Elena R.', prob: '100%' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fd-border bg-fd-muted/30 p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-500" />
          <span className="text-xs font-semibold text-fd-foreground">Q4 Active Revenue Pipeline</span>
        </div>
        <div className="flex gap-4 font-mono text-xs">
          <div>
            <span className="text-fd-muted-foreground">Weighted: </span>
            <span className="font-semibold text-fd-foreground">$542,500</span>
          </div>
          <div>
            <span className="text-fd-muted-foreground">Total Pipeline: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">$695,000</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title} className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between border-b border-fd-border pb-2">
              <span className="text-xs font-semibold text-fd-foreground">{col.title}</span>
              <span className="rounded bg-fd-muted px-1.5 py-0.5 text-[10px] font-mono text-fd-muted-foreground">
                {col.count}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs"
                >
                  <p className="text-xs font-medium text-fd-foreground">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {item.value}
                    </span>
                    <span className="text-fd-muted-foreground">{item.prob} win</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeopleOpsRosterPreview() {
  const employees = [
    { name: 'Elena Rostova', role: 'Staff Infrastructure Architect', dept: 'Engineering', status: 'Active', leave: '24d left' },
    { name: 'Marcus Vance', role: 'Head of Enterprise Sales', dept: 'Revenue', status: 'Active', leave: '18d left' },
    { name: 'Sophia Chen', role: 'Senior Product Designer', dept: 'Design', status: 'On Leave', leave: 'Returning Mon' },
    { name: 'Devon Miller', role: 'DevOps & Site Reliability Lead', dept: 'Engineering', status: 'Active', leave: '21d left' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-blue-500" />
          <span className="text-xs font-semibold text-fd-foreground">Organization Roster Directory</span>
        </div>
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          42 Total Staff
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-fd-border text-fd-muted-foreground">
              <th className="pb-2 font-medium">Employee</th>
              <th className="pb-2 font-medium">Department</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium text-right">Leave Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {employees.map((e) => (
              <tr key={e.name} className="hover:bg-fd-muted/30">
                <td className="py-2.5">
                  <div className="font-medium text-fd-foreground">{e.name}</div>
                  <div className="text-[11px] text-fd-muted-foreground">{e.role}</div>
                </td>
                <td className="py-2.5">
                  <span className="rounded border border-fd-border bg-fd-muted/40 px-2 py-0.5 text-[11px]">
                    {e.dept}
                  </span>
                </td>
                <td className="py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      e.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {e.status}
                  </span>
                </td>
                <td className="py-2.5 text-right font-mono text-[11px] text-fd-muted-foreground">
                  {e.leave}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HireFlowPipelinePreview() {
  const candidates = [
    { name: 'David Kim', role: 'Full-Stack Rust Engineer', stage: 'Technical Assessment', score: '4.8 / 5.0' },
    { name: 'Sarah Lin', role: 'Enterprise Account Executive', stage: 'Final Interview', score: '4.9 / 5.0' },
    { name: 'Anil Mehta', role: 'Database SRE Specialist', stage: 'Offer Stage', score: '5.0 / 5.0' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-purple-500" />
          <span className="text-xs font-semibold text-fd-foreground">Active Recruitment Requisitions</span>
        </div>
        <span className="text-xs text-fd-muted-foreground">5 Open Positions</span>
      </div>

      <div className="space-y-2">
        {candidates.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-lg border border-fd-border bg-fd-background p-3"
          >
            <div>
              <div className="text-xs font-medium text-fd-foreground">{c.name}</div>
              <div className="text-[11px] text-fd-muted-foreground">{c.role}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-fd-muted px-2 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
                {c.stage}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {c.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LedgerFlowLedgerPreview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
          <div className="text-[11px] text-fd-muted-foreground">Current Accounts Receivable</div>
          <div className="mt-1 font-mono text-lg font-bold text-fd-foreground">$184,200.00</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">92% current / 0 past due</div>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
          <div className="text-[11px] text-fd-muted-foreground">Accounts Payable</div>
          <div className="mt-1 font-mono text-lg font-bold text-fd-foreground">$42,850.00</div>
          <div className="text-[10px] text-fd-muted-foreground">Reconciled with StockFlow POs</div>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
          <div className="text-[11px] text-fd-muted-foreground">Net Operating Cash Flow</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">+$141,350.00</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">+18.4% month-over-month</div>
        </div>
      </div>
    </div>
  );
}

function StockFlowInventoryPreview() {
  const stock = [
    { sku: 'SRV-RACK-42U', name: 'Server Chassis Rack 42U', wh1: 120, wh2: 64, status: 'Healthy' },
    { sku: 'OPT-FIBER-10G', name: 'SFP+ 10Gb Transceiver Module', wh1: 450, wh2: 210, status: 'Healthy' },
    { sku: 'NVME-4TB-ENT', name: 'Enterprise NVMe Gen4 4TB', wh1: 18, wh2: 6, status: 'Low Stock' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <Boxes className="size-4 text-amber-500" />
          <span className="text-xs font-semibold text-fd-foreground">Multi-Facility Warehouse Balance</span>
        </div>
        <span className="text-xs text-fd-muted-foreground">East Coast Hub & EU Central</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-fd-border text-fd-muted-foreground">
              <th className="pb-2 font-medium">SKU / Item</th>
              <th className="pb-2 font-medium text-right">East Hub</th>
              <th className="pb-2 font-medium text-right">EU Hub</th>
              <th className="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {stock.map((item) => (
              <tr key={item.sku} className="hover:bg-fd-muted/30">
                <td className="py-2.5">
                  <div className="font-mono font-medium text-fd-foreground">{item.sku}</div>
                  <div className="text-[11px] text-fd-muted-foreground">{item.name}</div>
                </td>
                <td className="py-2.5 text-right font-mono">{item.wh1}</td>
                <td className="py-2.5 text-right font-mono">{item.wh2}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                      item.status === 'Healthy'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SprintFlowSprintPreview() {
  const issues = [
    { key: 'ENG-204', title: 'Implement asyncpg connection pooling and retry loop', pts: '5 pts', prio: 'High' },
    { key: 'ENG-208', title: 'Add scoped token verification middleware in FastAPI engine', pts: '3 pts', prio: 'Critical' },
    { key: 'ENG-211', title: 'Update OpenAPI 3.1 documentation generator scripts', pts: '2 pts', prio: 'Medium' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <FolderGit2 className="size-4 text-cyan-500" />
          <span className="text-xs font-semibold text-fd-foreground">Sprint 2026-Q4.02 Progress</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-fd-muted-foreground">38 of 45 Points Closed</span>
          <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
            84%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {issues.map((i) => (
          <div
            key={i.key}
            className="flex items-center justify-between rounded-lg border border-fd-border bg-fd-background p-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{i.key}</span>
              <span className="text-xs text-fd-foreground">{i.title}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded bg-fd-muted px-1.5 py-0.5 text-[10px] text-fd-muted-foreground">
                {i.pts}
              </span>
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                {i.prio}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocFlowWikiPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-blue-500" />
          <span className="text-xs font-semibold text-fd-foreground">Engineering Knowledge Base & SOPs</span>
        </div>
        <span className="font-mono text-xs text-fd-muted-foreground">Revision #42 (Committed)</span>
      </div>

      <div className="rounded-lg border border-fd-border bg-fd-background p-4 text-xs leading-relaxed text-fd-foreground">
        <h4 className="font-bold text-fd-foreground">Architecture SOP: Zero-Circular Dependency Enforcement</h4>
        <p className="mt-1 text-fd-muted-foreground">
          All domain modules in Innostes are strictly decoupled from the core engine using the import-linter contract.
          No business module may import another business module directly; cross-module events are published through
          the Kernel event bus.
        </p>
        <div className="mt-3 rounded border border-fd-border bg-fd-muted/30 p-2 font-mono text-[11px] text-fd-foreground">
          ✓ Contracts: 5 kept, 0 broken (Enforced on git commit)
        </div>
      </div>
    </div>
  );
}
