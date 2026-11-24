// Drop and recreate a database so the parity suite can run first-run setup again.
// Usage: node scripts/parity/reset-db.mjs <dbname>   (env: PGHOST PGPORT PGUSER PGPASSWORD)
import { createRequire } from 'node:module';
// 'pg' is resolved from PG_MODULE_FROM (a package.json path) or the NestJS backend's node_modules.
const require = createRequire(process.env.PG_MODULE_FROM || new URL('../../kernel/backend-nestjs/package.json', import.meta.url).pathname);
const { Client } = require('pg');
const db = process.argv[2];
if (!/^[a-z0-9_]+$/.test(db || '')) { console.error('usage: reset-db.mjs <dbname>'); process.exit(2); }
const c = new Client({ host: process.env.PGHOST || 'localhost', port: +(process.env.PGPORT || 5432), user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'admin', database: 'postgres' });
await c.connect();
await c.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [db]);
await c.query(`DROP DATABASE IF EXISTS ${db}`);
await c.query(`CREATE DATABASE ${db}`);
await c.end();
console.log('reset', db);
