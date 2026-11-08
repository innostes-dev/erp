#!/usr/bin/env node
/**
 * Design-system guard: product, website and docs UI must be built from shared tokens and pieces.
 * Fails on:
 *   - raw Tailwind palette colours (bg-blue-500, text-emerald-600, …): use semantic tokens
 *   - text below 12px (text-[10px], …): use text-caption / text-xs at minimum
 *   - gradient backgrounds (bg-gradient-*, bg-linear-*, bg-radial-*)
 *   - emoji in UI source
 *
 * See docs/ui-ux/ENTERPRISE_UI_AUDIT.md §5.5 and packages/ui/tailwind/theme.css.
 * usage: node scripts/checks/check-design-tokens.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** UI source roots that must stay on-system. */
const ROOTS = [
  'apps/web-app/src',
  'kernel/frontend/src',
  ...['modules', 'plugins'].flatMap((group) =>
    existsSync(join(root, group))
      ? readdirSync(join(root, group)).map((name) => `${group}/${name}/frontend/src`)
      : [],
  ),
  'apps/landing/components/home',
  'apps/landing/app/(home)',
  'apps/landing/components/logo.tsx',
];

const FAMILIES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const RULES = [
  {
    id: 'raw-palette',
    message: 'raw palette colour, use a semantic token (e.g. text-muted-foreground, bg-success-bg)',
    re: new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:bg|text|border|ring|outline|divide|fill|stroke|from|via|to|shadow|decoration)-(?:${FAMILIES})-\\d{2,3}\\b`, 'g'),
  },
  {
    id: 'tiny-text',
    message: 'text below 12px, use text-caption / text-xs as the minimum',
    re: /(?<![\w-])(?:[\w-]+:)*text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g,
  },
  {
    id: 'gradient',
    message: 'gradient background, surfaces are solid',
    re: /(?<![\w-])(?:[\w-]+:)*bg-(?:gradient|linear|radial)-[\w[\]/-]+/g,
  },
  {
    id: 'emoji',
    message: 'emoji in UI copy, use an icon from lucide-react',
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2B50}]/gu,
  },
];

function files(path) {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((name) => {
    if (['node_modules', 'dist', '.next', '__pycache__'].includes(name)) return [];
    const child = join(full, name);
    if (statSync(child).isDirectory()) return files(relative(root, child));
    return /\.(tsx?|jsx?)$/.test(name) && !/\.(test|spec)\./.test(name) ? [child] : [];
  });
}

const violations = [];
let checked = 0;
for (const file of ROOTS.flatMap(files)) {
  checked++;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      for (const match of line.matchAll(rule.re)) {
        violations.push(`${relative(root, file)}:${i + 1}  ${match[0]}  (${rule.message})`);
      }
    }
  });
}

if (violations.length) {
  console.error(`Design-token check failed: ${violations.length} violation(s) in ${checked} files.\n`);
  console.error(violations.slice(0, 200).join('\n'));
  if (violations.length > 200) console.error(`… and ${violations.length - 200} more`);
  process.exit(1);
}
console.log(`Design-token check passed (${checked} files).`);
