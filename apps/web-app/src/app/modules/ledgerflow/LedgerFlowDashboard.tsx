import { ModulePageHeader } from '../../components/ModulePageHeader';
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
      <ModulePageHeader
        preview
        title="LedgerFlow"
        description="Operating Currency: USD ($) & INR (₹) • FY 2026-27 • Double-Entry Balanced (Dr ≡ Cr)"
        actions={
          <>
            <Button disabled title="Available when this module launches" size="sm" variant="primary" startIcon={<Plus className="size-4" />}>
            New Invoice (AR)
          </Button>
          <Button disabled title="Available when this module launches" size="sm" variant="secondary" startIcon={<DollarSign className="size-4" />}>
            Record Payment (AP)
          </Button>
          </>
        }
      />

      {/* 2. Core CFO Liquidity & Solvency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Cash & Bank</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$1,420,000</span>
          </div>
          <p className="text-xs text-success-text font-semibold mt-2">17.3 Months Runway</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Accounts Payable (AP)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$45,200</span>
            <span className="text-xs text-muted-foreground">Due 30D</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">8 Bills verified (3-Way Match)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Accounts Receivable (AR)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$118,500</span>
          </div>
          <p className="text-xs text-warning-text font-semibold mt-2">$18,500 Overdue (&gt;30D)</p>
        </Card>

        <Card className="p-4 border-border bg-card shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Monthly Net Burn Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">$82,000</span>
            <span className="text-xs text-success-text font-semibold">-6% vs plan</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Payroll + Cloud Infra</p>
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
            <div className="p-3.5 rounded-xl border border-border bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-success-bg text-success-text font-bold flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Customer Invoice Paid — INV-2026-0042</span>
                    <Badge variant="success" className="text-xs">Posted</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Acme Corporation • Debit: Operating Bank / Credit: AR</p>
                </div>
              </div>
              <span className="text-sm font-bold text-success-text">+ $45,000.00</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary-tint text-primary font-bold flex items-center justify-center shrink-0">
                  <ArrowUpRight className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Monthly Payroll Run Committed — RUN-10</span>
                    <Badge variant="outline" className="text-xs">Payroll DAG</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">October Wages • Debit: Salary Expense / Credit: Net Payable</p>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">- $85,400.00</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted text-strong-foreground font-bold flex items-center justify-center shrink-0">
                  <ArrowUpRight className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Cloud Infrastructure Bill — AWS-OCT-99</span>
                    <Badge variant="outline" className="text-xs">3-Way Match Passed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Amazon Web Services • Debit: Hosting / Credit: AP</p>
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
                <ShieldAlert className="size-4 text-warning-text" />
                <h2 className="text-sm font-semibold text-foreground">Compliance Watchdog</h2>
              </div>
              <Badge variant="warning">Section 43B(h)</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-warning-bg border border-border text-xs flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-warning-text ">
                <AlertTriangle className="size-4 shrink-0" />
                <span>2 MSME Vendor Bills Expiring</span>
              </div>
              <p className="text-strong-foreground text-xs">
                Under Section 43B(h), payment must be committed within 45 days of GRN dock intake to avoid tax deduction disallowance.
              </p>
              <div className="text-xs font-semibold text-foreground pt-1 border-t border-border">
                • MicroPrecision Parts (₹1,40,000) — <strong>5 Days Left</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-border text-xs flex items-center justify-between">
              <span>GST E-Invoicing (IRN) API:</span>
              <Badge variant="success">NIC Connected</Badge>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Trial Balance Status:</span>
            <strong className="text-success-text font-semibold">Zero Variance ($0.00)</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
