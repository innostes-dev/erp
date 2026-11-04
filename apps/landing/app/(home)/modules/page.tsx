import type { Metadata } from 'next';
import { ModulesDirectoryClient } from './ModulesDirectoryClient';

export const metadata: Metadata = {
  title: 'Business Suites & Infrastructure Modules | Innostes Business OS',
  description:
    'Explore the modular business suites and developer infrastructure plugins that power Innostes. 4 enterprise business pillars + 1 developer platform. Deploy turnkey or consume headlessly.',
  openGraph: {
    title: 'Business Suites & Modules | Innostes Business OS',
    description:
      'Organized into 4 enterprise business pillars (Revenue, People, Finance, Product) plus a standalone developer platform. 100% free to self-host.',
    url: 'https://erp.innostes.com/modules',
  },
};

export default function ModulesDirectoryPage() {
  return <ModulesDirectoryClient />;
}
