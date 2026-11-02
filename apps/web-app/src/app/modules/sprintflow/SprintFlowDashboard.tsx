import { Badge, Button, Card } from '@innostes/ui';
import {
  CheckSquare,
  Flame,
  ArrowUp,
  Plus,
  Play,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export function SprintFlowDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Active Sprint Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SprintFlow Cockpit ⚡</h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
              Agile Sprint Flow
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sprint Goal: Finalize all module dashboards & sidemenu navigation • 4 Days Left • Velocity: 50 Pts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            Create Issue
          </Button>
          <Button size="sm" variant="outline" startIcon={<Play className="size-4" />}>
            Complete Sprint
          </Button>
        </div>
      </div>

      {/* 2. Sprint Velocity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Story Points Completed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">38 Pts</span>
            <span className="text-xs text-muted-foreground">/ 50 Pts</span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '76%' }} />
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">76% Scope Done</span>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">My Open Issues</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">4 Tasks</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">2 in code review</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Bugs & Defects (Active)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">3 Open</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">0 Critical Blockers (P1)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Sprint Velocity (Avg)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">48 Pts</span>
            <span className="text-xs text-emerald-600 font-semibold">+8%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Trailing 5 sprints</p>
        </Card>
      </div>

      {/* 3. Middle Section: Assigned Issues & Defect Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Assigned Issues in Current Sprint */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Assigned to Me in Sprint 42</h2>
            </div>
            <Badge variant="outline">4 Issues</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <Flame className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">[ERP-402]</span>
                    <span className="text-xs font-bold text-foreground">Implement Zoho People style web check-in widget</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Epic: PeopleOps Core MVP • Sub-tasks: 3 completed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge variant="outline">5 Pts</Badge>
                <Badge variant="info">In Progress</Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ArrowUp className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">[FIN-208]</span>
                    <span className="text-xs font-bold text-foreground">Enforce Section 43B(h) 45-day statutory MSME countdown</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Epic: LedgerFlow Statutory Guardrails</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge variant="outline">8 Pts</Badge>
                <Badge variant="outline">Code Review</Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary">[REV-109]</span>
                    <span className="text-xs font-bold text-foreground">1-Click lead conversion to account, contact, and deal</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Epic: RevOps Sales Pipeline</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge variant="outline">3 Pts</Badge>
                <Badge variant="success">Done</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Sprint Epics & Defects */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Sprint 42 Epics</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">PeopleOps Core Scaffold</span>
                  <span className="font-semibold text-emerald-600">90% Done</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">LedgerFlow Core Engine</span>
                  <span className="font-semibold text-primary">70% Done</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">RevOps Quotations Engine</span>
                  <span className="font-semibold text-amber-600">55% Done</span>
                </div>
                <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>ASC 350 R&D Capitalization:</span>
            <strong className="text-emerald-600 font-semibold">Eligible (80 Dev Hours)</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
