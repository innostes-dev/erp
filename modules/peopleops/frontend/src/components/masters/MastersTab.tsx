import { Button, EmptyState } from '@innostes/ui';
import { Database, Plus } from 'lucide-react';

export function MastersTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Dynamic Masters & Picklists</h3>
          <p className="text-sm text-muted-foreground">Configure departments, job designations, office locations, and dynamic dropdown lists.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" startIcon={<Plus />}>
            Add Department
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<Database />}
        title="Dynamic Masters Ready"
        description="Tenant-specific departments, designations, branches, and lightweight picklists can be configured here."
      />
    </div>
  );
}
