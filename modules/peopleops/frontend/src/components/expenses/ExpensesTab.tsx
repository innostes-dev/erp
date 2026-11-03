import { Button, EmptyState } from '@innostes/ui';
import { Plus, Receipt } from 'lucide-react';

export function ExpensesTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Expense Claims & Reimbursements</h3>
          <p className="text-sm text-muted-foreground">Submit corporate expense receipts and route multi-tier approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" startIcon={<Plus />}>
            New Expense Claim
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<Receipt />}
        title="No Expense Claims Found"
        description="Submit business expenses, upload receipts, and track payout statuses."
      />
    </div>
  );
}
