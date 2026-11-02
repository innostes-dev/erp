import { Badge, Button, Card } from '@innostes/ui';
import {
  Landmark,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ShieldAlert,
} from 'lucide-react';

export function LedgerFlowDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">LedgerFlow Cockpit 🏛️</h1>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5">
              General Ledger Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operating Currency: USD ($) & INR (₹) • FY 2026-27 • Double-Entry Balanced (Dr ≡ Cr)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            New Invoice (AR)
          </Button>
          <Button size="sm" variant="outline" startIcon={<DollarSign className="size-4" />}>
            Record Payment (AP)
          </Button>
        </div>
      </div>

      {/* 2. Core CFO Liquidity & Solvency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Cash & Bank</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$1,420,000</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">17.3 Months Runway</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Accounts Payable (AP)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$45,200</span>
            <span className="text-xs text-muted-foreground">Due 30D</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">8 Bills verified (3-Way Match)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Accounts Receivable (AR)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$118,500</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-2">$18,500 Overdue (&gt;30D)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Monthly Net Burn Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$82,000</span>
            <span className="text-xs text-emerald-600 font-semibold">-6% vs plan</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Payroll + Cloud Infra</p>
        </Card>
      </div>

      {/* 3. Statutory Watchdog Alert Card & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ledger Postings */}
        <Card className="lg:col-span-2 p-6 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent General Ledger Vouchers</h2>
            </div>
            <Badge variant="outline">Auto-Balanced</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Customer Invoice Paid — INV-2026-0042</span>
                    <Badge variant="success" className="text-[10px]">Posted</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Acme Corporation • Debit: Operating Bank / Credit: AR</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">+ $45,000.00</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center shrink-0">
                  <ArrowUpRight className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Monthly Payroll Run Committed — RUN-10</span>
                    <Badge variant="outline" className="text-[10px]">Payroll DAG</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">October Wages • Debit: Salary Expense / Credit: Net Payable</p>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">- $85,400.00</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center shrink-0">
                  <ArrowUpRight className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Cloud Infrastructure Bill — AWS-OCT-99</span>
                    <Badge variant="outline" className="text-[10px]">3-Way Match Passed</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Amazon Web Services • Debit: Hosting / Credit: AP</p>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">- $12,450.00</span>
            </div>
          </div>
        </Card>

        {/* Statutory Watchdog Banner */}
        <Card className="p-6 border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">Compliance Watchdog</h2>
              </div>
              <Badge variant="warning">Section 43B(h)</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>2 MSME Vendor Bills Expiring</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Under Section 43B(h), payment must be committed within 45 days of GRN dock intake to avoid tax deduction disallowance.
              </p>
              <div className="text-[11px] font-semibold text-foreground pt-1 border-t border-amber-500/20">
                • MicroPrecision Parts (₹1,40,000) — <strong>5 Days Left</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs flex items-center justify-between">
              <span>GST E-Invoicing (IRN) API:</span>
              <Badge variant="success">NIC Connected</Badge>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Trial Balance Status:</span>
            <strong className="text-emerald-600 font-semibold">Zero Variance ($0.00)</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
