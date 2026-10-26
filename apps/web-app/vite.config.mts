/// <reference types='vitest' />
import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app',
  server: {
    port: 4200,
    // IPv4 loopback: reachable as both http://localhost:4200 and http://127.0.0.1:4200
    // ('localhost' alone binds only IPv6 [::1] on some machines).
    host: '127.0.0.1',
  },
  preview: {
    port: 4300,
    host: '127.0.0.1',
  },
  plugins: [react()],
  resolve: {
    // Use workspace packages (@innostes/ui, @innostes/kernel) straight from their
    // source via the "@innostes/source" export condition. No library build is
    // needed before `serve`, and edits to those packages hot-reload here.
    conditions: ['@innostes/source', ...defaultClientConditions],
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
