import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/core/database/src/lib/schema/index.ts',
  out: './libs/core/database/src/lib/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/innostes_os',
  },
});
