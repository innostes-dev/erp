import { tracuraManifest } from '@innostes/tracura';
import { crmManifest } from '@innostes/crm';
import { hrmsManifest } from '@innostes/hrms';

export interface CatalogItem {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'module' | 'plugin';
  tags: string[];
  tone: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';
  href: string;
  subFeatures: { id: string; label: string; description: string }[];
}

export const BUSINESS_MODULES_CATALOG: CatalogItem[] = [
  hrmsManifest,
  crmManifest,
];

export const PLUGINS_CATALOG: CatalogItem[] = [
  tracuraManifest,
];
