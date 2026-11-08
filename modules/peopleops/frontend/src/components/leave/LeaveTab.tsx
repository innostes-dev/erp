import { Button, EmptyState, PageHeader, IconTile } from '@innostes/ui';
import { Calendar, Plus } from 'lucide-react';

export function LeaveTab() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave Governance"
        description="Manage time-off balances, policy accruals, and team applications."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" startIcon={<Plus />}>
              Apply for Leave
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder for balances */}
      </div>

      <EmptyState
        icon={<IconTile tone="neutral" size="lg"><Calendar /></IconTile>}
        title="Leave Management Operational"
        description="Leave applications, team approvals, and company holiday calendars will appear here."
      />
    </div>
  );
}
