'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FolderGit2,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

export function SalesFlowPreviewMini() {
  const [activePipeline, setActivePipeline] = useState<'sales' | 'workforce'>('sales');

  return (
    <div className="space-y-4">
      {/* Top Module Subnav */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fd-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePipeline('sales')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activePipeline === 'sales'
                ? 'bg-primary-tint text-primary '
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            <TrendingUp className="size-3.5" />
            SalesFlow CRM
          </button>
          <button
            onClick={() => setActivePipeline('workforce')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              activePipeline === 'workforce'
                ? 'bg-primary-tint text-primary '
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            <Users className="size-3.5" />
            PeopleOps HRMS
          </button>
        </div>

        <Link
          href={activePipeline === 'sales' ? '/modules/salesflow' : '/modules/peopleops'}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline "
        >
          <span>Open Full {activePipeline === 'sales' ? 'SalesFlow' : 'PeopleOps'} Suite</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {activePipeline === 'sales' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Column 1 */}
          <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between border-b border-fd-border pb-2">
              <span className="text-xs font-semibold text-fd-foreground">Qualified Deals</span>
              <span className="font-mono text-xs text-fd-muted-foreground">$145k</span>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">Vanguard Systems Rollout</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary ">$85,000</span>
                  <span className="text-fd-muted-foreground">60% Win Prob</span>
                </div>
              </div>
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">HyperScale Cloud Ops</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary ">$60,000</span>
                  <span className="text-fd-muted-foreground">50% Win Prob</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between border-b border-fd-border pb-2">
              <span className="text-xs font-semibold text-fd-foreground">In Negotiation</span>
              <span className="font-mono text-xs text-fd-muted-foreground">$210k</span>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">Acme Global Business OS</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary ">$135,000</span>
                  <span className="text-success-text font-semibold">85% Win Prob</span>
                </div>
              </div>
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">Apex FinTech Cluster</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary ">$75,000</span>
                  <span className="text-success-text font-semibold">90% Win Prob</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="rounded-xl border border-fd-border bg-fd-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between border-b border-fd-border pb-2">
              <span className="text-xs font-semibold text-fd-foreground">Closed / Won</span>
              <span className="font-mono text-xs text-success-text ">$340k</span>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">OmniCorp Multi-Tenant Ops</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-success-text ">$190,000</span>
                  <span className="text-success-text ">100% Won</span>
                </div>
              </div>
              <div className="rounded-lg border border-fd-border bg-fd-background p-2.5 shadow-xs">
                <p className="text-xs font-medium text-fd-foreground">Nexus Logistics Suite</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-success-text ">$150,000</span>
                  <span className="text-success-text ">100% Won</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-fd-border text-fd-muted-foreground">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fd-border">
              {[
                { name: 'Elena Rostova', role: 'Staff Platform Architect', dept: 'Engineering', status: 'Active' },
                { name: 'Marcus Vance', role: 'Head of Enterprise Revenue', dept: 'Sales', status: 'Active' },
                { name: 'Devon Miller', role: 'DevOps & SRE Specialist', dept: 'Engineering', status: 'Active' },
              ].map((row) => (
                <tr key={row.name} className="hover:bg-fd-muted/30">
                  <td className="py-2.5 font-medium text-fd-foreground">{row.name}</td>
                  <td className="py-2.5 text-fd-muted-foreground">{row.role}</td>
                  <td className="py-2.5">
                    <span className="rounded bg-fd-muted px-2 py-0.5 text-xs">{row.dept}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-success-text font-semibold">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HeadlessApiPreviewMini() {
  const [copied, setCopied] = useState(false);

  const snippet = `curl -X POST https://api.yourdomain.com/salesflow/deals \\
  -H "Authorization: Bearer inno_live_sec_8849b2c" \\
  -H "X-Tenant-ID: acme-corp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Enterprise Business OS Deployment",
    "amount": 135000,
    "stage": "negotiation",
    "probability": 0.85
  }'`;

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-fd-border bg-brand-navy p-4 font-mono text-xs text-white dark:bg-black">
      <div className="mb-3 flex items-center justify-between border-b border-border-strong pb-2 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-success" />
          <span>Decoupled Backend cURL Execution</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded border border-border-strong bg-brand-navy px-2.5 py-1 text-sidebar-foreground hover:text-white"
        >
          {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
          <span>{copied ? 'Copied' : 'Copy cURL'}</span>
        </button>
      </div>

      <pre className="overflow-x-auto text-muted-foreground">
        <code>{snippet}</code>
      </pre>

      <div className="mt-4 border-t border-border-strong pt-3">
        <div className="text-xs text-muted-foreground">Response (200 OK • 1.4 ms latency):</div>
        <pre className="mt-1 overflow-x-auto text-success">
          <code>{`{
  "id": "deal_01jf8b2c",
  "title": "Enterprise Business OS Deployment",
  "amount": 135000.0,
  "stage": "negotiation",
  "probability": 0.85,
  "tenant_id": "acme-corp"
}`}</code>
        </pre>
      </div>
    </div>
  );
}
