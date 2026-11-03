import { Button, EmptyState } from '@innostes/ui';
import { Calendar, Clock, Plus } from 'lucide-react';

export function AttendanceTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Time & Attendance</h3>
          <p className="text-sm text-muted-foreground">Monitor daily clock punches, working hours, and regularization requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" startIcon={<Calendar />}>
            Monthly Timesheets
          </Button>
          <Button size="sm" startIcon={<Plus />}>
            Regularize Punch
          </Button>
        </div>
      </div>

      <EmptyState
        icon={<Clock />}
        title="Attendance Tracking Active"
        description="Daily punch blocks, late entry warnings, and biometric sync logs will appear here."
      />
    </div>
  );
}
