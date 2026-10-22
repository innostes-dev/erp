/// <reference types='vitest/config' />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * After the JS build:
 * - precompile dist/styles.css for apps that don't use Tailwind;
 * - generate dist/api.json (component props from TSDoc) for the docs site.
 */
function postBuild(): Plugin {
  const run = (command: string) =>
    execSync(command, { cwd: import.meta.dirname, stdio: 'inherit' });
  return {
    name: 'innostes-ui-post-build',
    apply: 'build',
    closeBundle() {
      run(
        'pnpm exec tailwindcss -i ./tailwind/styles.css -o ./dist/styles.css --minify',
      );
      run('node ./scripts/generate-api-docs.mjs');
    },
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
    }),
    postBuild(),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es' as const],
    },
    rolldownOptions: {
      // Dependencies are installed by the consumer, never bundled.
      external: [
        /^react(-dom)?(\/.*)?$/,
        /^@base-ui\/react(\/.*)?$/,
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
      ],
      output: {
        // One file per source module: tree-shakable, and each file keeps its own
        // 'use client' directive, so only interactive components become client modules
        // (helpers like cn() and buttonVariants() stay usable in Server Components).
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    // Tests import the public entry, like a consumer would. Here it maps to the source;
    // tests/ui-react18 maps it to the built package on React 18.
    alias: { '@innostes/ui': path.join(import.meta.dirname, 'src/index.ts') },
  },
  test: {
    name: 'ui',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    // Generous, because CI runs the React 17/18/19 suites in parallel.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: '../../coverage/packages/ui',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/index.ts'],
    },
  },
}));
