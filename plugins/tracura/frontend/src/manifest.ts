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

export const tracuraManifest: PluginManifest = {
  id: 'tracura',
  name: 'Tracura',
  version: '0.1.0',
  description: 'Open-source distributed API telemetry, secret-scrubbing, and request inspection engine',
  type: 'plugin',
  tags: ['Observability', 'Telemetry', 'OpenSource', 'Tracing'],
  tone: 'chart-5',
  href: '/plugins/tracura',
  subFeatures: [
    { id: 'overview', label: 'Overview', description: 'Real-time telemetry, error rates, and request latency KPIs.' },
    { id: 'logs', label: 'Request Logs', description: 'Live HTTP request/response payloads, headers, and trace inspection.' },
    { id: 'keys', label: 'Ingestion Keys', description: 'Manage Google-style scoped ingestion API keys and IP allowlists.' },
    { id: 'settings', label: 'Settings & Policies', description: 'Retention policies, sampling rate, and sensitive field scrubbers.' },
  ],
};

// Backwards compatibility alias
export const apiLoggerManifest: PluginManifest = tracuraManifest;
