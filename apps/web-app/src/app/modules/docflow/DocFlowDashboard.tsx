import { Badge, Button, Card } from '@innostes/ui';
import {
  FileText,
  Star,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

export function DocFlowDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DocFlow Knowledge Base 📚</h1>
            <Badge variant="outline" className="border-teal-500/30 text-teal-600 bg-teal-500/5">
              Living SOPs & Docs
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            4 Team Spaces • 142 Living SOPs & Policy Manuals • Real-time ERP Data Blocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            New Document
          </Button>
          <Button size="sm" variant="outline" startIcon={<Sparkles className="size-4" />}>
            Use Template
          </Button>
        </div>
      </div>

      {/* 2. Top Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              🛠️
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Engineering</p>
              <p className="text-[11px] text-muted-foreground">ADRs, RFCs & APIs</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">48 Pages • 6 Contributors</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              👥
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">People & Culture</p>
              <p className="text-[11px] text-muted-foreground">Handbook & Benefits</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">22 Pages • Updated today</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              📈
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Sales & GTM</p>
              <p className="text-[11px] text-muted-foreground">Playbooks & Battlecards</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">34 Pages • Live SalesFlow block</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Operations & SOPs</p>
              <p className="text-[11px] text-muted-foreground">Warehouse & Safety</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">38 Pages • Live BOM block</p>
        </Card>
      </div>

      {/* 3. Middle Section: Starred & Recently Visited Living SOPs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Starred Pages */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Starred & Essential Documents</h2>
            </div>
            <span className="text-xs text-muted-foreground">Pinned by Team</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Innostes Employee Handbook 2026-27</span>
                    <Badge variant="outline" className="text-[10px]">HR Core</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Leave policies, working hours, travel expenses, code of conduct</p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">Edited 2d ago</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">SOP: Month-End Financial Close Runbook</span>
                    <Badge variant="outline" className="text-[10px]">LedgerFlow GL</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Bank reconciliation checklist, depreciation journal commit steps</p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">Edited 5d ago</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">ADR-042: Action-as-a-Tool Architecture for Autonomous Ops</span>
                    <Badge variant="outline" className="text-[10px]">Engineering</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">JSON schema boundaries, deterministic execution, cryptographic audit trail</p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">Edited Oct 24</span>
            </div>
          </div>
        </Card>

        {/* Popular Templates */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Standard Templates</h2>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-foreground">Product Spec (PRD)</p>
                  <p className="text-[10px] text-muted-foreground">Problem, scope, UX user stories</p>
                </div>
                <Button size="sm" variant="outline">Use</Button>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-foreground">Incident Postmortem</p>
                  <p className="text-[10px] text-muted-foreground">5 Whys, timeline, action tasks</p>
                </div>
                <Button size="sm" variant="outline">Use</Button>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-foreground">Standard Operating Proc.</p>
                  <p className="text-[10px] text-muted-foreground">Step-by-step SOP with screenshots</p>
                </div>
                <Button size="sm" variant="outline">Use</Button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Living ERP Embeds:</span>
            <strong className="text-emerald-600 font-semibold">Active</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
