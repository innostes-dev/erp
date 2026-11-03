import { Button, EmptyState } from '@innostes/ui';
import { FileSpreadsheet, Plus, Users } from 'lucide-react';

export function EmployeesTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Employee Directory</h3>
          <p className="text-sm text-muted-foreground">Manage organization hierarchy, active workforce, and profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" startIcon={<FileSpreadsheet />}>
            Import CSV
          </Button>
          <Button size="sm" startIcon={<Plus />}>
            New Employee
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<Users />}
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
