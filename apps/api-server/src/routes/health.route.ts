import { Hono } from 'hono';

const HEALTHY_STATUS = 'ok' as const;
const MB = 1024 * 1024;

const nowIso = () => new Date().toISOString();
const toMegabytesText = (bytes: number) => `${Math.round(bytes / MB)} MB`;

export const healthRouter = new Hono()
  .get('/', (c) =>
    c.json({
      status: HEALTHY_STATUS,
      timestamp: nowIso(),
    }),
  )
  .get('/details', (c) => {
    const memory = process.memoryUsage();

    return c.json({
      status: HEALTHY_STATUS,
      timestamp: nowIso(),
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memory: {
        rss: toMegabytesText(memory.rss),
        heapUsed: toMegabytesText(memory.heapUsed),
        heapTotal: toMegabytesText(memory.heapTotal),
      },
    });
  });