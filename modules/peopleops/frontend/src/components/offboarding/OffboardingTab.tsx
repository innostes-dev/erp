import { Button, EmptyState } from '@innostes/ui';
import { LogOut, Plus } from 'lucide-react';

export function OffboardingTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Separations & Final Settlement (F&F)</h3>
          <p className="text-sm text-muted-foreground">Manage employee resignations, department clearance tasks, and Gratuity/Encashment settlements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" startIcon={<Plus />}>
            Initiate Separation
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<LogOut />}
        title="No Active Separations"
        description="Employee separation cases, department clearance sign-offs, and final settlement sheets will appear here."
      />
    </div>
  );
}
