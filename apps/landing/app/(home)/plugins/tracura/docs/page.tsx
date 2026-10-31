import type { Metadata } from 'next';
import { TracuraDocsClient } from './TracuraDocsClient';

export const metadata: Metadata = {
  title: 'Tracura Developer Documentation & REST API Reference',
  description:
    'Complete developer integration guide and interactive REST API reference for Tracura (Universal Open-Source API Logger & Telemetry). Learn how to ingest telemetry, generate scoped keys, configure PII scrubbing, and automate via API.',
  openGraph: {
    title: 'Tracura Developer Documentation & REST API Reference',
    description:
      'Complete developer integration guide and interactive REST API reference for Tracura (Universal Open-Source API Logger & Telemetry).',
  },
};

export default function TracuraDocsPage() {
  return <TracuraDocsClient />;
}
