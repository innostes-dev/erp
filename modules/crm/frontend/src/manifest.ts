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

export const crmManifest: ModuleManifest = {
  id: 'crm',
  name: 'CRM',
  version: '0.1.0',
  description: 'Customers and relationships',
  type: 'module',
  tags: ['Leads', 'Deals', 'Pipeline'],
  tone: 'chart-2',
  href: '/modules/crm',
  subFeatures: [
    { id: 'overview', label: 'Overview', description: 'Pipeline analytics, deal velocity, and key metrics.' },
    { id: 'leads', label: 'Leads', description: 'Lead capture, qualification stages, and assignment.' },
    { id: 'deals', label: 'Deals', description: 'Active sales opportunities, stages, and forecasts.' },
    { id: 'pipeline', label: 'Pipeline', description: 'Visual Kanban pipeline and stage transitions.' },
    { id: 'contacts', label: 'Contacts', description: 'Customer accounts, contacts, and communication history.' },
  ],
};
