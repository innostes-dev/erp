import { tracuraManifest } from '@innostes/tracura';
import { ALL_BUSINESS_MODULES } from './modules/catalog-data';

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

export const BUSINESS_MODULES_CATALOG: CatalogItem[] = ALL_BUSINESS_MODULES;

export const PLUGINS_CATALOG: CatalogItem[] = [
  tracuraManifest,
];
