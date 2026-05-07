import type { AppConfig } from './config.types';

export function getConfig(): AppConfig {
  return {
    apiUrl: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001',
    cdnUrl: process.env['NEXT_PUBLIC_CDN_URL'] ?? '',
    environment: (process.env['NODE_ENV'] as AppConfig['environment']) ?? 'development',
    version: process.env['NEXT_PUBLIC_APP_VERSION'] ?? '0.0.0',
  };
}
