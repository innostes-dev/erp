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

export const revopsManifest: ModuleManifest = {
  id: 'revops',
  name: 'RevOps',
  version: '0.1.0',
  description: 'Revenue operations, customer pipeline, deals, accounts, and quotes',
  type: 'module',
  tags: ['Leads', 'Deals', 'Pipeline', 'Quotes'],
  tone: 'chart-2',
  href: '/modules/revops',
  subFeatures: [
    { id: 'dashboard', label: 'Dashboard', description: 'Sales cockpit, quota attainment, today tasks, and hot deals.' },
    { id: 'leads', label: 'Leads', description: 'Inbound leads, qualification stepper, and 1-click deal convert.' },
    { id: 'contacts', label: 'Contacts', description: 'Contact persons directory, titles, and phone/email.' },
    { id: 'accounts', label: 'Accounts', description: 'Customer companies, parent-child subsidiaries, and 360 view.' },
    { id: 'deals', label: 'Deals & Pipeline', description: 'Visual drag-and-drop Kanban sales pipeline across stages.' },
    { id: 'quotes', label: 'Quotes & Proposals', description: 'Line-item quote builder, discounts, and branded PDF export.' },
    { id: 'orders', label: 'Sales Orders', description: 'Confirmed customer orders and credit hold checks.' },
    { id: 'analytics', label: 'Sales Analytics', description: 'Weighted revenue forecasting and rep performance.' },
  ],
};
