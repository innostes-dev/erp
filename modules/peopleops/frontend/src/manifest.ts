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
  description: 'People operations, web check-in, attendance, leave, and payroll',
  type: 'module',
  tags: ['Employees', 'Attendance', 'Leave', 'Payroll'],
  tone: 'chart-3',
  href: '/modules/peopleops',
  subFeatures: [
    { id: 'dashboard', label: 'Dashboard', description: 'Personal home, Web check-in/out, live timer, and leave balance.' },
    { id: 'employees', label: 'Employees', description: 'Employee directory, profiles, and organization structure.' },
    { id: 'onboarding', label: 'Onboarding', description: 'New hire pre-boarding and statutory document verification.' },
    { id: 'attendance', label: 'Attendance', description: 'Daily punches, working hours, and regularization requests.' },
    { id: 'leave', label: 'Leave', description: 'Time-off requests, team approvals, and holiday calendar.' },
    { id: 'payroll', label: 'Payroll', description: 'Monthly salary runs, payslips, and bank payout CSV.' },
    { id: 'performance', label: 'Performance', description: 'Goal setting, appraisal cycles, and team reviews.' },
    { id: 'expenses', label: 'Expenses', description: 'Expense claims, receipts, and reimbursement payouts.' },
  ],
};
