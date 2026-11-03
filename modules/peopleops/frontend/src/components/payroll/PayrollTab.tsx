import { Button, EmptyState } from '@innostes/ui';
import { CreditCard, FileSpreadsheet, Plus } from 'lucide-react';

export function PayrollTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Payroll Engine</h3>
          <p className="text-sm text-muted-foreground">Process monthly salary batches, generate statutory payslips, and export bank CMS files.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" startIcon={<FileSpreadsheet />}>
            Bank CMS Export
          </Button>
          <Button size="sm" startIcon={<Plus />}>
            New Pay Run
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<CreditCard />}
        title="No Payroll Runs Executed"
        description="Run monthly gross-to-net payroll calculations with statutory deductions (EPF, ESI, PT, TDS)."
      />
    </div>
  );
}
