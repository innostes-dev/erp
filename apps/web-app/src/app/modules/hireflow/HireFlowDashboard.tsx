import { Badge, Button, Card } from '@innostes/ui';
import {
  Briefcase,
  Users,
  Calendar,
  Plus,
  Video,
} from 'lucide-react';

export function HireFlowDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">HireFlow Cockpit 🎯</h1>
            <Badge variant="outline" className="border-purple-500/30 text-purple-600 bg-purple-500/5">
              Talent Acquisition Flow
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active Requisitions: 8 Openings • 48 Candidates in Evaluation Pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            Post Job Opening
          </Button>
          <Button size="sm" variant="outline" startIcon={<Users className="size-4" />}>
            Add Candidate
          </Button>
        </div>
      </div>

      {/* 2. Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Active Requisitions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">8 Roles</span>
            <span className="text-xs text-muted-foreground">3 pending budget</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Engineering & Sales</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Candidates in Funnel</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">48</span>
            <span className="text-xs text-purple-600 font-semibold">+14 this week</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">12 in final interview</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Interviews This Week</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">16 Scheduled</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">4 rounds today</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Avg. Time-to-Hire</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">22 Days</span>
            <span className="text-xs text-emerald-600 font-semibold">-4 days vs Q3</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Target: &lt; 25 days</p>
        </Card>
      </div>

      {/* 3. Middle Section: Today's Interviews & Active Requisition Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Interviews Schedule */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Today's Interview Schedule</h2>
            </div>
            <Badge variant="outline">4 Rounds Today</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center text-xs shrink-0">
                  AK
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Amit Kumar — Senior Backend Engineer</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Round 2: Distributed Systems Architecture • 10:30 AM (60 min)</p>
                  <p className="text-[11px] text-muted-foreground">Panel: Vikram Nair (Lead), Sneha Roy</p>
                </div>
              </div>
              <Button size="sm" variant="primary" startIcon={<Video className="size-3" />}>
                Join Google Meet
              </Button>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center text-xs shrink-0">
                  RM
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Rohan Mehta — Account Executive</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Round 3: Commercial Negotiation Mock • 02:00 PM (45 min)</p>
                  <p className="text-[11px] text-muted-foreground">Panel: Arun Kumar (VP Sales)</p>
                </div>
              </div>
              <Button size="sm" variant="primary" startIcon={<Video className="size-3" />}>
                Join Google Meet
              </Button>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center text-xs shrink-0">
                  SL
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Swati Lal — Product Designer</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Round 1: Portfolio Walkthrough • 04:30 PM (45 min)</p>
                  <p className="text-[11px] text-muted-foreground">Panel: Anita Desai (Lead Designer)</p>
                </div>
              </div>
              <Button size="sm" variant="primary" startIcon={<Video className="size-3" />}>
                Join Google Meet
              </Button>
            </div>
          </div>
        </Card>

        {/* Priority Requisitions */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Priority Openings</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Staff Backend Engineer</span>
                  <Badge variant="warning">Urgent</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">8 Candidates in pipeline • 2 at offer</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Enterprise Account Executive</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">14 Candidates in pipeline • 4 demo</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Security Compliance Engineer</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">6 Candidates in screening</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>PeopleOps Onboarding Handshake:</span>
            <strong className="text-emerald-600 font-semibold">2 Signed Offers Ready</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
