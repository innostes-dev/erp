export type RegistryModule = {
  id: string;
  name: string;
  sidebarGroups: Array<{
    title: string;
    links: Array<{ href: string; label: string }>;
  }>;
  headerNav?: Array<{ href: string; label: string }>;
  theme?: { primary: string };
  themeColor?: string;
};

export async function fetchRegistryModules(): Promise<RegistryModule[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3333';
  
  try {
    const response = await fetch(`${API_URL}/api/registry/modules`, {
      headers: { 'x-tenant-id': 'tenant_demo' },
      cache: 'no-store',
    });

    if (response.ok) {
      const modules = (await response.json()) as RegistryModule[];
      if (modules.length > 0) return modules;
    }
  } catch (error) {
    console.error('Failed to fetch registry modules:', error);
  }

  // Fallback / Hardcoded modules for development
  return [
    {
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
    },
  ];
}
