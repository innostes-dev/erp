import type { Metadata } from 'next';
import { BuildPageClient } from './BuildPageClient';

export const metadata: Metadata = {
  title: 'Custom software, built on INNOSTES',
  description:
    'Tell us the problem and we will find the right system. Our core team builds custom software for startups on the INNOSTES platform, so it ships faster, costs less and keeps your data private.',
  alternates: { canonical: '/build' },
  openGraph: {
    title: 'Tell us the problem. We will find the right system.',
    description: 'Custom software for startups, built by the team behind INNOSTES on an already-engineered core.',
    url: 'https://innostes.com/build',
  },
};

export default function BuildPage() {
  return <BuildPageClient />;
}
