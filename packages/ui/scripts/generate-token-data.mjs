#!/usr/bin/env node
/**
 * Reads the design tokens (tailwind/primitives.css, theme.css, dark.css), resolves every colour,
 * checks the WCAG contrast of the pairs the design system promises, and writes the data the docs
 * site renders (apps/landing/lib/tokens-data.json).
 *
 *   node packages/ui/scripts/generate-token-data.mjs          # regenerate + verify
 *   node packages/ui/scripts/generate-token-data.mjs --check  # verify only (CI)
 *
 * Exits non-zero if any pair falls below its WCAG threshold, so contrast can't silently regress.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tw = (f) => readFileSync(join(here, '..', 'tailwind', f), 'utf8');
const OUT = join(here, '..', '..', '..', 'apps', 'landing', 'lib', 'tokens-data.json');
const CHECK_ONLY = process.argv.includes('--check');

/** `--name: value;` declarations inside the first block matching `selector`. */
function declarations(css, selector) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Block not found: ${selector}`);
  let depth = 0;
  let i = css.indexOf('{', start);
  const open = i;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) break;
  }
  const body = css.slice(open + 1, i).replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim().replace(/\s+/g, ' ');
  return out;
}

const primitives = declarations(tw('primitives.css'), ':root');
const light = declarations(tw('theme.css'), '@theme default');
const dark = declarations(tw('dark.css'), "[data-theme='dark']");

function resolve(value, scope, seen = new Set()) {
  const m = /^var\((--[\w-]+)\)$/.exec(value);
  if (!m) return value;
  if (seen.has(m[1])) throw new Error(`Cycle at ${m[1]}`);
  seen.add(m[1]);
  const next = scope[m[1]] ?? light[m[1]] ?? primitives[m[1]];
  if (next === undefined) throw new Error(`Unresolved ${m[1]}`);
  return resolve(next, scope, seen);
}

/* ── Colour maths (sRGB hex and rgb()/rgba(); alpha composited over the background) ── */
function parse(color) {
  const c = color.trim().toLowerCase();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/.exec(c);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  throw new Error(`Unsupported colour: ${color}`);
}
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});
const lum = ({ r, g, b }) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
function ratio(fgToken, bgToken, scope, base) {
  const canvas = parse(resolve(scope['--color-background'] ?? light['--color-background'], scope));
  const bg = over(parse(resolve(scope[bgToken] ?? light[bgToken], scope)), base ?? canvas);
  const fg = over(parse(resolve(scope[fgToken] ?? light[fgToken], scope)), bg);
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

/* ── What the system promises (docs/ui-ux/ENTERPRISE_UI_AUDIT.md §4) ── */
const TEXT = { requirement: 'WCAG AA normal text (≥ 4.5:1)', minRatio: 4.5 };
const UI = { requirement: 'WCAG AA UI component / graphic (≥ 3:1)', minRatio: 3 };
const PAIRS = [
  ['Body text on background', '--color-foreground', '--color-background', TEXT],
  ['Body text on page canvas', '--color-foreground', '--color-canvas', TEXT],
  ['Card text on card surface', '--color-card-foreground', '--color-card', TEXT],
  ['Secondary text on card', '--color-muted-foreground', '--color-card', TEXT],
  ['Secondary text on page canvas', '--color-muted-foreground', '--color-canvas', TEXT],
  ['Secondary text on subtle surface', '--color-muted-foreground', '--color-muted', TEXT],
  ['Secondary text on selected row', '--color-strong-foreground', '--color-primary-tint', TEXT],
  ['Primary button label on primary', '--color-primary-foreground', '--color-primary', TEXT],
  ['Primary button label on hover', '--color-primary-foreground', '--color-primary-hover', TEXT],
  ['Link / selected text on card', '--color-primary', '--color-card', TEXT],
  ['Link / selected text on tint', '--color-primary', '--color-primary-tint', TEXT],
  ['Secondary button label', '--color-secondary-foreground', '--color-secondary', TEXT],
  ['Destructive button label', '--color-destructive-foreground', '--color-destructive', TEXT],
  ['Success text on success background', '--color-success-text', '--color-success-bg', TEXT],
  ['Warning text on warning background', '--color-warning-text', '--color-warning-bg', TEXT],
  ['Error text on error background', '--color-error-text', '--color-error-bg', TEXT],
  ['Info text on info background', '--color-info-text', '--color-info-bg', TEXT],
  ['Success text on card', '--color-success-text', '--color-card', TEXT],
  ['Warning text on card', '--color-warning-text', '--color-card', TEXT],
  ['Error text on card', '--color-error-text', '--color-card', TEXT],
  ['Info text on card', '--color-info-text', '--color-card', TEXT],
  ['AI text on AI tint', '--color-ai-text', '--color-ai-tint', TEXT],
  ['Text-input border on card', '--color-input', '--color-card', UI],
  ['Focus ring on card', '--color-ring', '--color-card', UI],
  ['Sidebar item text on sidebar', '--color-sidebar-foreground', '--color-sidebar', TEXT],
  ['Sidebar group label on sidebar', '--color-sidebar-muted-foreground', '--color-sidebar', TEXT],
  ['Sidebar active item label', '--color-sidebar-accent-foreground', '--color-sidebar-primary-soft', TEXT],
  ['Sidebar active indicator', '--color-sidebar-primary', '--color-sidebar-primary-soft', UI],
];

const CATEGORIES = [
  { role: 'Surfaces', description: 'Page canvas, control surfaces, cards and popovers.', match: /^--color-(canvas|background|foreground|card|popover)/ },
  { role: 'Actions', description: 'Executive Blue for primary actions, links and selection; neutral secondary actions.', match: /^--color-(primary|secondary)/ },
  { role: 'Text & subtle UI', description: 'Secondary text, disabled text and hover surfaces.', match: /^--color-(muted|strong|subtle|accent)/ },
  { role: 'Brand accents', description: 'Midnight Navy and the restrained teal reserved for AI / intelligence.', match: /^--color-(brand|ai)/ },
  { role: 'Status', description: 'Icon / text / background triads. Use the -text shade for any text.', match: /^--color-(success|warning|error|destructive|info)/ },
  { role: 'Lines & focus', description: 'Hairlines, strong borders, input borders (3:1) and the focus ring.', match: /^--color-(border|input|ring)/ },
  { role: 'App shell', description: 'Solid Midnight Navy sidebar.', match: /^--color-sidebar/ },
  { role: 'Data visualisation', description: 'Ordered chart series; never used for module identity.', match: /^--color-chart/ },
];

const tokens = Object.keys(light)
  .filter((n) => n.startsWith('--color-') && n !== '--color-overlay')
  .map((name) => {
    const category = CATEGORIES.find((c) => c.match.test(name))?.role ?? 'Other';
    return {
      name,
      shortName: name.replace('--color-', ''),
      category,
      lightValue: resolve(light[name], light),
      darkValue: resolve(dark[name] ?? light[name], { ...light, ...dark }),
      lightRaw: light[name],
      darkRaw: dark[name] ?? light[name],
    };
  });

const failures = [];
const contrastPairs = PAIRS.map(([name, textToken, bgToken, rule]) => {
  const darkScope = { ...light, ...dark };
  const navy = name.startsWith('Sidebar') ? parse(resolve(light['--color-sidebar'], light)) : undefined;
  const lr = ratio(textToken, bgToken, light, navy);
  const dr = ratio(textToken, bgToken, darkScope, name.startsWith('Sidebar') ? parse(resolve(darkScope['--color-sidebar'], darkScope)) : undefined);
  const entry = {
    name,
    textToken,
    bgToken,
    requirement: rule.requirement,
    minRatio: rule.minRatio,
    light: { ratio: lr, formatted: `${lr.toFixed(2)}:1`, pass: lr >= rule.minRatio },
    dark: { ratio: dr, formatted: `${dr.toFixed(2)}:1`, pass: dr >= rule.minRatio },
  };
  if (!entry.light.pass) failures.push(`${name} (light) ${entry.light.formatted} < ${rule.minRatio}`);
  if (!entry.dark.pass) failures.push(`${name} (dark) ${entry.dark.formatted} < ${rule.minRatio}`);
  return entry;
});

const data = {
  generatedAt: new Date().toISOString(),
  categories: CATEGORIES.map(({ role, description }) => ({
    role,
    description,
    tokens: tokens.filter((t) => t.category === role).map((t) => t.name),
  })),
  tokens,
  contrastPairs,
};

if (!CHECK_ONLY) writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`${tokens.length} tokens, ${contrastPairs.length} contrast pairs checked (light + dark).`);
if (failures.length) {
  console.error(`Contrast failures:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(CHECK_ONLY ? 'Contrast OK.' : `Contrast OK. Wrote ${OUT}`);
