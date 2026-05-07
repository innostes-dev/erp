import type { NextConfig } from 'next';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Proxy /api/* to the NestJS gateway so browser calls work in dev
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  transpilePackages: [
    '@mono/kernel/auth',
    '@mono/kernel/state',
    '@mono/kernel/event-bus',
    '@mono/kernel/router',
    '@mono/kernel/config',
    '@mono/kernel/telemetry',
    '@mono/ui/components',
    '@mono/ui/tokens',
    '@mono/ui/icons',
    '@mono/shared/utils',
    '@mono/shared/hooks',
    '@mono/shared/constants',
    '@mono/data-access/http',
    '@mono/modules/analytics/feature',
    '@mono/modules/analytics/ui',
    '@mono/modules/analytics/data-access',
    '@mono/modules/analytics/utils',
  ],

  typedRoutes: true,
};

export default nextConfig;
