import type { Metadata } from 'next';
import { ServicesPageClient } from './ServicesPageClient';

export const metadata: Metadata = {
  title: 'Services & Deployment Pricing | Innostes Business OS',
  description:
    'Innostes is 100% free to self-host. Explore assisted cloud setup, database migration, and custom module engineering services from our core team.',
  openGraph: {
    title: 'Services & Deployment | Innostes Business OS',
    description: '100% free self-hosting or assisted cloud deployment and custom engineering.',
    url: 'https://erp.innostes.com/services',
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
