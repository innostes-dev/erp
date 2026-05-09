/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@innostes/modules/hrms/feature-ui', '@innostes/core/design-system', '@luxis-ui/react'],
};

module.exports = nextConfig;
