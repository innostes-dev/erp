import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@modules': path.resolve(import.meta.dirname, '../../modules'),
    },
  },
  server: {
    fs: {
      // Allow serving files from the monorepo root (modules and packages)
      allow: ['..', '../../packages', '../../modules'],
    },
  },
})
