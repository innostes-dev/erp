import react from '@vitejs/plugin-react'
import path from 'node:path';
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, '../../modules'),
    },
  },
  server: {
    fs: {
      // Allow serving files from the monorepo root (modules and packages)
      allow: ['..', '../../packages', '../../modules'],
    },
  },
})
