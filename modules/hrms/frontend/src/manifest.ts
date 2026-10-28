export interface SubFeature {
  id: string;
  label: string;
  description: string;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'module';
  tags: string[];
  tone: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';
  href: string;
  subFeatures: SubFeature[];
}

export const hrmsManifest: ModuleManifest = {
  id: 'hrms',
  name: 'HRMS',
  version: '0.1.0',
  description: 'People and human resources',
  type: 'module',
  tags: ['Employees', 'Leave', 'Payroll'],
  tone: 'chart-3',
  href: '/modules/hrms',
  subFeatures: [
    { id: 'overview', label: 'Overview', description: 'HR metrics, headcount, and quick actions.' },
    { id: 'employees', label: 'Employees', description: 'Employee directory, profiles, and organization chart.' },
    { id: 'leave', label: 'Leave', description: 'Time-off requests, approvals, and holiday calendars.' },
    { id: 'payroll', label: 'Payroll', description: 'Salary structures, payslips, and compliance reports.' },
    { id: 'attendance', label: 'Attendance', description: 'Timesheets, shifts, and check-in logs.' },
  ],
};
