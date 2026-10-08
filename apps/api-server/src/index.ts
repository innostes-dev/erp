import { serve } from '@hono/node-server';
import { createApplication } from './app.js';

const app = await createApplication();
const port = Number(process.env.PORT) || 3000;

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`[ERP Engine] Server running on http://localhost:${info.port}`);
  }
);

// Graceful termination handling
const shutdown = () => {
  console.log('\n[ERP Engine] Shutting down gracefully...');
  server.close(() => {
    console.log('[ERP Engine] Process terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);