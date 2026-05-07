export interface NavItem {
  id: string;
  label: string;
  route: string;
  iconId: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  gradient: string;
  iconColor: string;
  borderColor: string;
  badge?: string;
  navItems: NavItem[];
}

export const MODULES: ModuleDefinition[] = [
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Real-time dashboards, metrics, and data insights across the platform.',
    route: '/analytics',
    gradient: 'from-indigo-500 to-violet-600',
    iconColor: 'text-indigo-100',
    borderColor: 'hover:border-indigo-300',
    navItems: [
      { id: 'dashboard', label: 'Dashboard', route: '/analytics', iconId: 'home' },
      { id: 'reports', label: 'Reports', route: '/analytics/reports', iconId: 'document' },
      { id: 'insights', label: 'Insights', route: '/analytics/insights', iconId: 'lightbulb' },
      { id: 'settings', label: 'Settings', route: '/analytics/settings', iconId: 'cog' },
    ],
  },
];
