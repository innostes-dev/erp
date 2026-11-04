import { Button, EmptyState } from '@innostes/ui';
import { Calendar, Clock, Plus, CheckCircle, LogOut } from 'lucide-react';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="text-md font-medium mb-4">Quick Punch</h4>
          <div className="flex gap-4">
            <Button size="lg" className="w-full" startIcon={<CheckCircle />}>
              Check In
            </Button>
            <Button size="lg" variant="secondary" className="w-full" startIcon={<LogOut />}>
              Check Out
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h4 className="text-md font-medium mb-4">Today's Status</h4>
          <EmptyState
            icon={<Clock />}
            title="Attendance Tracking Active"
            description="Daily punch blocks, late entry warnings, and biometric sync logs will appear here."
          />
        </div>
      </div>
    </div>
  );
}
