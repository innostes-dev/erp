import type { ModuleManifest } from '@innostes/hrms';

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
