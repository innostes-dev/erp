import { Button, EmptyState } from '@innostes/ui';
import { Calendar, Plus } from 'lucide-react';

export function LeaveTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Leave Governance</h3>
          <p className="text-sm text-muted-foreground">Manage time-off balances, policy accruals, and team applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" startIcon={<Plus />}>
            Apply for Leave
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder for balances */}
      </div>

      <EmptyState
        icon={<Calendar />}
        title="Leave Management Operational"
        description="Leave applications, team approvals, and company holiday calendars will appear here."
      />
    </div>
  );
}
