import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MODULES_DATA } from '@/lib/modules-data';
import { ModuleLandingClient } from './ModuleLandingClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(MODULES_DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const module = MODULES_DATA[slug];

  if (!module) {
    return {
      title: 'Module Not Found | Innostes Business OS',
    };
  }

  return {
    title: `${module.name} — ${module.tagline} | Innostes Business OS`,
    description: `${module.name}: ${module.heroDescription} 100% free to self-host or deploy headlessly with Innostes Business OS.`,
    openGraph: {
      title: `${module.name} | Innostes Business OS`,
      description: module.tagline,
      type: 'website',
      url: `https://erp.innostes.com/modules/${module.slug}`,
    },
  };
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const module = MODULES_DATA[slug];

  if (!module) {
    notFound();
  }

  return <ModuleLandingClient module={module} />;
}
