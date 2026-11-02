import { useState } from 'react';
import { Badge, Button, Card } from '@innostes/ui';
import {
  DollarSign,
  Briefcase,
  PhoneCall,
  Plus,
} from 'lucide-react';

export function SalesFlowDashboard() {
  const [tasks, setTasks] = useState([
    { id: 't1', time: '09:30 AM', title: 'Call Rajesh Kumar (CloudMatrix)', subtitle: 'Post-demo pricing review', done: false },
    { id: 't2', time: '11:00 AM', title: 'Send revised quote to Titan Labs', subtitle: 'Include 10% volume discount', done: false },
    { id: 't3', time: '02:30 PM', title: 'Architecture demo with Zenith Retail', subtitle: 'With Solutions Engineer', done: true },
    { id: 't4', time: '04:30 PM', title: 'Quarterly review with Horizon Infotech', subtitle: 'Expansion opportunity', done: false },
  ]);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quota Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SalesFlow Cockpit 🚀</h1>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/5">
              Sales & Pipeline
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Representative: Arun Kumar • Territory: India Mid-Market • 12 Days Remaining
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            New Lead
          </Button>
          <Button size="sm" variant="outline" startIcon={<DollarSign className="size-4" />}>
            Add Deal
          </Button>
        </div>
      </div>

      {/* 2. Target Progress & Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Monthly Quota</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$85,000</span>
            <span className="text-xs text-muted-foreground">/ $100,000</span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '85%' }} />
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">85% Achieved</span>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Open Pipeline</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$305,000</span>
            <span className="text-xs text-emerald-600 font-semibold">+18% MoM</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">11 Active Opportunities</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Win Rate (Trailing 90D)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">34.8%</span>
            <span className="text-xs text-muted-foreground">8 of 23 won</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Industry avg: 22%</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Average Sales Cycle</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">24 Days</span>
            <span className="text-xs text-emerald-600 font-semibold">-3 days faster</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Lead to Closed-Won</p>
        </Card>
      </div>

      {/* 3. Middle Row: Pipeline by Stage & Today's Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Pipeline Stage Breakdown */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Active Deals by Stage</h2>
            </div>
            <span className="text-xs text-muted-foreground">Weighted Forecast: <strong className="text-foreground">$178,500</strong></span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>1. Discovery</span>
                <Badge variant="outline" className="text-[10px]">20%</Badge>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">$120,000</p>
              <p className="text-[10px] text-muted-foreground">4 Opportunities</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>2. Demo</span>
                <Badge variant="outline" className="text-[10px]">40%</Badge>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">$80,000</p>
              <p className="text-[10px] text-muted-foreground">3 Opportunities</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>3. Proposal</span>
                <Badge variant="outline" className="text-[10px]">70%</Badge>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">$65,000</p>
              <p className="text-[10px] text-muted-foreground">2 Opportunities</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>4. Closing</span>
                <Badge variant="outline" className="text-[10px]">90%</Badge>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">$40,000</p>
              <p className="text-[10px] text-muted-foreground">1 Opportunity</p>
            </div>
          </div>

          {/* Hot Deals List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              🔥 Hot Deals Closing This Month
            </span>
            <div className="p-3 rounded-xl bg-muted/15 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Acme Corporation — Enterprise Cloud Rollout</p>
                <p className="text-[11px] text-muted-foreground">Decision Maker: Rajesh Kumar (VP Tech) • Target: Nov 15</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">$45,000</span>
                <Badge variant="success" className="ml-2">Proposal Sent</Badge>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/15 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Titan Labs — IoT Platform Integration</p>
                <p className="text-[11px] text-muted-foreground">Decision Maker: Priya Sharma (Director) • Target: Nov 22</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">$40,000</span>
                <Badge variant="outline" className="ml-2">Demo Done</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Calls & Follow-ups */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Today's Action Items</h2>
              </div>
              <Badge variant="outline">{tasks.filter((t) => !t.done).length} Pending</Badge>
            </div>

            <div className="flex flex-col gap-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    task.done
                      ? 'bg-muted/10 border-border/40 opacity-60'
                      : 'bg-muted/20 border-border hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => {}}
                    className="mt-0.5 size-3.5 rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{task.time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{task.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Recent Win:</span>
            <span className="text-emerald-600 font-semibold">Horizon Cloud ($50k) closed 🎉</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
