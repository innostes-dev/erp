export interface SubFeature {
  id: string;
  label: string;
  description: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'plugin';
  tags: string[];
  tone: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';
  href: string;
  subFeatures: SubFeature[];
}

export const apiLoggerManifest: PluginManifest = {
  id: 'api-logger',
  name: 'API Logger',
  version: '0.1.0',
  description: 'API request logging, webhook inspection, and debugging',
  type: 'plugin',
  tags: ['Logs', 'Webhooks', 'Analytics'],
  tone: 'chart-5',
  href: '/plugins/api-logger',
  subFeatures: [
    { id: 'overview', label: 'Overview', description: 'Real-time telemetry, error rates, and request latency.' },
    { id: 'logs', label: 'Request Logs', description: 'Live HTTP request/response payloads and headers inspection.' },
    { id: 'webhooks', label: 'Webhooks', description: 'Outbound webhook deliveries, retries, and failure alerts.' },
    { id: 'analytics', label: 'Analytics', description: 'Endpoint performance charts, 95th percentile latency, and status code distributions.' },
  ],
};
