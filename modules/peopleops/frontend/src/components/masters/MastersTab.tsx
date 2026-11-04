import { Button, EmptyState, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@innostes/ui';
import { Database, Plus, RefreshCw, Building2, Briefcase, MapPin, CalendarDays, ListOrdered } from 'lucide-react';

export function MastersTab() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">Dynamic Masters & Picklists</h3>
          <p className="text-sm text-muted-foreground mt-1">Configure departments, job designations, office locations, and dynamic dropdown lists to match your organization's hierarchy.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" startIcon={<RefreshCw className="w-4 h-4" />}>
            Reseed Defaults
          </Button>
          <Button size="sm" startIcon={<Plus className="w-4 h-4" />}>
            Add Department
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Departments
            </CardTitle>
            <CardDescription>Manage organizational structure and cost centers.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">8 default departments configured.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Designations
            </CardTitle>
            <CardDescription>Define functional job titles and families without pay constraints.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">14 default designations configured.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Locations
            </CardTitle>
            <CardDescription>Configure office branches, geofences, and timezones.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">0 active locations.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Holiday Calendars
            </CardTitle>
            <CardDescription>Manage regional and global statutory holiday schedules.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">0 configured calendars.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-primary" />
              Picklists
            </CardTitle>
            <CardDescription>Dynamic dropdowns for documents, relations, and settings.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">12 standard picklist categories.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 border rounded-md bg-muted/20">
        <EmptyState
          icon={<Database className="w-8 h-8 text-muted-foreground" />}
          title="Master Data Overview Ready"
          description="Use the cards above to drill down into specific master data categories and configure your organization."
        />
      </div>
    </div>
  );
}
