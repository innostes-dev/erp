import type { Metadata } from 'next';
import { TracuraLandingClient } from './TracuraLandingClient';

export const metadata: Metadata = {
  title: 'Tracura | Open-Source Distributed API Telemetry & Observability Engine',
  description:
    'Tracura: Universal, open-source API telemetry and request inspection engine. Ingest 10,000+ req/sec across microservices, serverless functions, and AI agent pipelines with a sub-millisecond ring buffer. 100% self-hosted, PII-scrubbed, and API-key enabled.',
  openGraph: {
    title: 'Tracura | Open-Source Distributed API Telemetry & Observability Engine',
    description:
      'Universal, open-source API telemetry and request inspection engine. Ingest 10,000+ req/sec across any service or stack with scoped API keys.',
    images: ['/images/tracura/dashboard-preview.jpg'],
  },
};

export default function TracuraPage() {
  return <TracuraLandingClient />;
}
