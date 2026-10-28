#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const BUDGETS = [
  {
    name: 'Root Entry (@innostes/ui)',
    file: 'index.js',
    maxRawKb: 25.0,
    maxGzipKb: 10.0,
  },
  {
    name: 'Charts Entry (@innostes/ui/charts)',
    file: 'charts/index.js',
    maxRawKb: 55.0,
    maxGzipKb: 15.0,
  },
  {
    name: 'Editor Entry (@innostes/ui/editor)',
    file: 'editor/index.js',
    maxRawKb: 45.0,
    maxGzipKb: 15.0,
  },
  {
    name: 'Standalone Styles (@innostes/ui/styles.css)',
    file: 'styles.css',
    maxRawKb: 110.0,
    maxGzipKb: 20.0,
  },
];

console.log('Evaluating @innostes/ui bundle size budgets...\n');

let failed = false;
const results = [];

for (const target of BUDGETS) {
  const filePath = path.join(distDir, target.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing distribution artifact: ${target.file}. Did you run "pnpm nx build ui"?`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(filePath);
  const rawKb = content.length / 1024;
  const gzipKb = zlib.gzipSync(content).length / 1024;

  const rawPass = rawKb <= target.maxRawKb;
  const gzipPass = gzipKb <= target.maxGzipKb;

  if (!rawPass || !gzipPass) {
    failed = true;
  }

  results.push({
    name: target.name,
    file: target.file,
    rawKb: rawKb.toFixed(2),
    maxRawKb: target.maxRawKb.toFixed(2),
    gzipKb: gzipKb.toFixed(2),
    maxGzipKb: target.maxGzipKb.toFixed(2),
    status: rawPass && gzipPass ? 'PASS' : 'FAIL',
  });
}

console.table(results);

if (failed) {
  console.error('\n❌ Bundle size budget exceeded! Check entry points or dependencies.');
  process.exit(1);
} else {
  console.log('\n✓ All entry points and stylesheets conform to bundle size budgets.');
}
