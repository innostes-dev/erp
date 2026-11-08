import { Button, EmptyState, PageHeader, IconTile } from '@innostes/ui';
import { FileSpreadsheet, Plus, Users } from 'lucide-react';

export function EmployeesTab() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee Directory"
        description="Manage organization hierarchy, active workforce, and profiles."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" startIcon={<FileSpreadsheet />}>
              Import CSV
            </Button>
            <Button size="sm" startIcon={<Plus />}>
              New Employee
            </Button>
          </div>
        }
      />

      <EmptyState
        icon={<IconTile tone="neutral" size="lg"><Users /></IconTile>}
        title="No Employees Found"
        description="Build your organization directory by adding employees, assigning managers, and setting up departments."
        actions={
          <div className="flex gap-2">
            <Button size="sm" startIcon={<Plus />}>
              Add First Employee
            </Button>
          </div>
        }
      />
    </div>
  );
}
