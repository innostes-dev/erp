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

export const peopleopsManifest: ModuleManifest = {
  id: 'peopleops',
  name: 'PeopleOps',
  version: '0.1.0',
  description: 'People operations, web check-in, attendance, leave, payroll, expenses, and offboarding',
  type: 'module',
  tags: ['Employees', 'Attendance', 'Leave', 'Payroll', 'Expenses'],
  tone: 'chart-3',
  href: '/modules/peopleops',
  subFeatures: [
    { id: 'dashboard', label: 'Dashboard', description: 'Personal home, Web check-in/out, live timer, and leave balance.' },
    { id: 'employees', label: 'Employees', description: 'Employee directory, profiles, and organization structure.' },
    { id: 'attendance', label: 'Attendance', description: 'Daily punches, working hours, and regularization requests.' },
    { id: 'leave', label: 'Leave', description: 'Time-off requests, team approvals, and holiday calendar.' },
    { id: 'payroll', label: 'Payroll', description: 'Monthly salary runs, payslips, and bank payout CSV.' },
    { id: 'expenses', label: 'Expenses', description: 'Expense claims, receipts, and reimbursement payouts.' },
    { id: 'offboarding', label: 'Offboarding', description: 'Separation workflows, department clearance, and F&F settlement.' },
    { id: 'masters', label: 'Masters', description: 'Departments, designations, office locations, and dynamic picklists.' },
  ],
};
