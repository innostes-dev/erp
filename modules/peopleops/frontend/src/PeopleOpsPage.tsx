import { useState } from 'react';
import {
  Badge,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@innostes/ui';
import { peopleopsManifest } from './manifest';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { EmployeesTab } from './components/employees/EmployeesTab';
import { AttendanceTab } from './components/attendance/AttendanceTab';
import { LeaveTab } from './components/leave/LeaveTab';
import { PayrollTab } from './components/payroll/PayrollTab';
import { ExpensesTab } from './components/expenses/ExpensesTab';
import { OffboardingTab } from './components/offboarding/OffboardingTab';
import { MastersTab } from './components/masters/MastersTab';

export function PeopleOpsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Module Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{peopleopsManifest.name}</span>
            <Badge variant="outline">Enterprise HRMS</Badge>
            <Badge variant="success" dot>Phase 0 Ready</Badge>
          </div>
        }
        description={peopleopsManifest.description}
      />

      {/* Sub-feature Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(String(val))}>
        <TabsList>
          {peopleopsManifest.subFeatures.map((sub) => (
            <TabsTab key={sub.id} value={sub.id}>
              {sub.label}
            </TabsTab>
          ))}
        </TabsList>

        <TabsPanel value="dashboard" className="pt-4">
          <DashboardTab />
        </TabsPanel>

        <TabsPanel value="employees" className="pt-4">
          <EmployeesTab />
        </TabsPanel>

        <TabsPanel value="attendance" className="pt-4">
          <AttendanceTab />
        </TabsPanel>

        <TabsPanel value="leave" className="pt-4">
          <LeaveTab />
        </TabsPanel>

        <TabsPanel value="payroll" className="pt-4">
          <PayrollTab />
        </TabsPanel>

        <TabsPanel value="expenses" className="pt-4">
          <ExpensesTab />
        </TabsPanel>

        <TabsPanel value="offboarding" className="pt-4">
          <OffboardingTab />
        </TabsPanel>

        <TabsPanel value="masters" className="pt-4">
          <MastersTab />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
