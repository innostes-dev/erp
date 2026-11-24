// Compare a backend's OpenAPI spec against the FastAPI reference (kernel operations only).
// Usage: node scripts/parity/gap-report.mjs <candidate openapi.json | http(s) url>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KERNEL_TAGS = new Set(['Authentication', 'Tenancy', 'Setup', 'User management', 'General', 'Observability']);
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const norm = (p) => p.replace(/\{[^}]+\}/g, '{}').replace(/\/+$/, '') || '/';

async function load(src) {
  if (/^https?:\/\//.test(src)) return (await fetch(src)).json();
  return JSON.parse(fs.readFileSync(src, 'utf8'));
}
const keys = (spec, kernelOnly) => {
  const out = new Map();
  for (const [p, item] of Object.entries(spec.paths || {})) {
    for (const m of METHODS) {
      const op = item[m];
      if (!op) continue;
      if (kernelOnly && !KERNEL_TAGS.has((op.tags || ['?'])[0])) continue;
      out.set(`${m.toUpperCase()} ${norm(p)}`, op);
    }
  }
  return out;
};

const ref = keys(await load(path.join(root, 'apps/api-server/openapi.json')), true);
const cand = keys(await load(process.argv[2] || (console.error('usage: gap-report.mjs <spec>'), process.exit(2))), false);
const missing = [...ref.keys()].filter((k) => !cand.has(k));
const MODULE_PREFIX = /^[A-Z]+ \/(peopleops|salesflow|tracura|plugins)(\/|$)/;
const extra = [...cand.keys()].filter((k) => !ref.has(k) && !MODULE_PREFIX.test(k));
console.log(`reference kernel operations: ${ref.size}`);
console.log(`implemented: ${ref.size - missing.length}/${ref.size}`);
if (missing.length) console.log('\nMISSING:\n  ' + missing.join('\n  '));
if (extra.length) console.log('\nEXTRA (not in reference):\n  ' + extra.join('\n  '));
process.exit(missing.length ? 1 : 0);
