import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@innostes/ui';
import {
  Calendar,
  CreditCard,
  FileSpreadsheet,
  Plus,
  UserCheck,
  Users,
} from 'lucide-react';
import { hrmsManifest } from './manifest';

export function HrmsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Module Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{hrmsManifest.name}</span>
            <Badge variant="outline">Module Scaffold</Badge>
            <Badge variant="success" dot>Active</Badge>
          </div>
        }
        description={hrmsManifest.description}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" startIcon={<Plus />}>
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Sub-feature Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(String(val))}>
        <TabsList>
          {hrmsManifest.subFeatures.map((sub) => (
            <TabsTab key={sub.id} value={sub.id}>
              {sub.label}
            </TabsTab>
          ))}
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsPanel value="overview" className="pt-4">
          <EmptyState
            icon={<UserCheck />}
            title="HRMS Module Operational"
            description="The HRMS application is active. You can manage employees, leave requests, payroll processing, and attendance tracking."
            actions={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setActiveTab('employees')}>
                  View Employees
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('leave')}>
                  Leave Calendar
                </Button>
              </div>
            }
          />
        </TabsPanel>

        {/* Tab 2: Employees */}
        <TabsPanel value="employees" className="pt-4">
          <EmptyState
            icon={<Users />}
            title="No Employees Found"
            description="Start building your organization by adding team members to your employee directory."
            actions={
              <div className="flex gap-2">
                <Button size="sm" startIcon={<Plus />}>
                  New Employee
                </Button>
                <Button size="sm" variant="outline" startIcon={<FileSpreadsheet />}>
                  Import CSV
                </Button>
              </div>
            }
          />
        </TabsPanel>

        {/* Tab 3: Leave */}
        <TabsPanel value="leave" className="pt-4">
          <EmptyState
            icon={<Calendar />}
            title="No Leave Requests"
            description="Staff leave requests and annual holiday calendars will appear here."
            actions={
              <Button size="sm" variant="outline">
                Configure Leave Policy
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 4: Payroll */}
        <TabsPanel value="payroll" className="pt-4">
          <EmptyState
            icon={<CreditCard />}
            title="Payroll Cycle Ready"
            description="Salary structures, payslips, and tax compliance components are ready for configuration."
            actions={
              <Button size="sm" variant="outline">
                Configure Payroll Rules
              </Button>
            }
          />
        </TabsPanel>

        {/* Tab 5: Attendance */}
        <TabsPanel value="attendance" className="pt-4">
          <EmptyState
            icon={<UserCheck />}
            title="Attendance Tracking"
            description="Connect biometric logs, shift schedules, and check-in timesheets."
            actions={
              <Button size="sm" variant="outline">
                Setup Shift Schedules
              </Button>
            }
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

export default HrmsPage;
