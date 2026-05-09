export const hrmsManifest = {
  id: 'hr',
  name: 'HRMS',
  headerNav: [
    { href: '/hr', label: 'Dashboard' },
    { href: '/hr/directory', label: 'Directory' },
    { href: '/hr/reports', label: 'Reports' },
  ],
  sidebarGroups: [
    {
      title: 'Core HR',
      links: [
        { href: '/hr', label: 'Dashboard' },
        { href: '/hr/employees', label: 'Employees' },
        { href: '/hr/payroll', label: 'Payroll' },
        { href: '/hr/attendance', label: 'Attendance' },
      ],
    },
    {
      title: 'Talent',
      links: [
        { href: '/hr/recruitment', label: 'Recruitment' },
        { href: '/hr/performance', label: 'Performance' },
      ],
    },
    {
      title: 'System',
      links: [
        { href: '/hr/settings', label: 'Settings' },
      ],
    },
  ],
};
