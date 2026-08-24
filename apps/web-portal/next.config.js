//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const path = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  // Transpile @luxis-ui/react TypeScript source through Next.js compiler.
  // Remove this line when @luxis-ui/react is published to npm (pre-built bundle).
  transpilePackages: ['@luxis-ui/react'],
  webpack(config) {
    // Alias @luxis-ui/react directly to source index.ts.
    // Required because the package's "main" field points to ./dist/cjs/index.js
    // which doesn't exist in local dev (source-only, not built).
    // Remove this alias when @luxis-ui/react is published to npm.
    config.resolve.alias['@luxis-ui/react'] = path.resolve(
      __dirname,
      '../../@luxis-ui/react/src/index.ts'
    );
    return config;
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
