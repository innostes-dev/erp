import { Button, Card, EmptyState } from '@innostes/ui';
import { Clock, MapPin, UserCheck, Users } from 'lucide-react';

export function DashboardTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick Action Bar: Web Check-In & Presence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Today's Workday</span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight font-mono">00:00:00</div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="w-full" startIcon={<Clock />}>
              Web Check-In
            </Button>
            <Button size="sm" variant="outline" startIcon={<MapPin />}>
              Office
            </Button>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Available Leaves</div>
            <div className="text-2xl font-bold mt-1">18.0 <span className="text-xs text-muted-foreground font-normal">Days</span></div>
          </div>
          <div className="text-xs text-muted-foreground">
            Casual (4) · Sick (6) · Paid (8)
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Team Presence</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span>All Present</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            No team members on planned leave today.
          </div>
        </Card>
      </div>

      <EmptyState
        icon={<UserCheck />}
        title="PeopleOps Operational Dashboard"
        description="Daily attendance punches, quick approvals, and upcoming holiday schedules will appear here."
      />
    </div>
  );
}
