#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const themePath = resolve(__dirname, '../../../packages/ui/tailwind/theme.css');
const darkPath = resolve(__dirname, '../../../packages/ui/tailwind/dark.css');
const outputPath = resolve(__dirname, '../lib/tokens-data.json');

// Standard Tailwind v4 OKLCH values for palette variables
const PALETTE_FALLBACKS = {
  'var(--color-white)': { oklch: 'oklch(100% 0 0)', hex: '#ffffff', l: 1, c: 0, h: 0 },
  'var(--color-zinc-950)': { oklch: 'oklch(14.1% 0.005 285.823)', hex: '#09090b', l: 0.141, c: 0.005, h: 285.823 },
  'var(--color-zinc-900)': { oklch: 'oklch(21% 0.006 285.885)', hex: '#18181b', l: 0.21, c: 0.006, h: 285.885 },
  'var(--color-zinc-800)': { oklch: 'oklch(27.4% 0.006 286.033)', hex: '#27272a', l: 0.274, c: 0.006, h: 286.033 },
  'var(--color-zinc-700)': { oklch: 'oklch(37% 0.013 285.805)', hex: '#3f3f46', l: 0.37, c: 0.013, h: 285.805 },
  'var(--color-zinc-600)': { oklch: 'oklch(44.2% 0.017 285.786)', hex: '#52525b', l: 0.442, c: 0.017, h: 285.786 },
  'var(--color-zinc-500)': { oklch: 'oklch(55.2% 0.016 285.938)', hex: '#71717a', l: 0.552, c: 0.016, h: 285.938 },
  'var(--color-zinc-400)': { oklch: 'oklch(70.5% 0.015 286.067)', hex: '#a1a1aa', l: 0.705, c: 0.015, h: 286.067 },
  'var(--color-zinc-300)': { oklch: 'oklch(87.1% 0.006 286.286)', hex: '#d4d4d8', l: 0.871, c: 0.006, h: 286.286 },
  'var(--color-zinc-200)': { oklch: 'oklch(92% 0.004 286.32)', hex: '#e4e4e7', l: 0.92, c: 0.004, h: 286.32 },
  'var(--color-zinc-100)': { oklch: 'oklch(96.7% 0.003 264.542)', hex: '#f4f4f5', l: 0.967, c: 0.003, h: 264.542 },
  'var(--color-zinc-50)': { oklch: 'oklch(98.5% 0 0)', hex: '#fafafa', l: 0.985, c: 0, h: 0 },

  'var(--color-blue-700)': { oklch: 'oklch(48.8% 0.243 264.376)', hex: '#1d4ed8', l: 0.488, c: 0.243, h: 264.376 },
  'var(--color-blue-600)': { oklch: 'oklch(54.6% 0.245 262.881)', hex: '#2563eb', l: 0.546, c: 0.245, h: 262.881 },
  'var(--color-blue-500)': { oklch: 'oklch(62.3% 0.214 259.815)', hex: '#3b82f6', l: 0.623, c: 0.214, h: 259.815 },
  'var(--color-blue-400)': { oklch: 'oklch(70.7% 0.165 254.624)', hex: '#60a5fa', l: 0.707, c: 0.165, h: 254.624 },
  'var(--color-blue-50)': { oklch: 'oklch(97% 0.014 254.604)', hex: '#eff6ff', l: 0.97, c: 0.014, h: 254.604 },

  'var(--color-red-700)': { oklch: 'oklch(50.5% 0.213 27.518)', hex: '#b91c1c', l: 0.505, c: 0.213, h: 27.518 },
  'var(--color-red-600)': { oklch: 'oklch(57.7% 0.245 27.325)', hex: '#dc2626', l: 0.577, c: 0.245, h: 27.325 },
  'var(--color-emerald-700)': { oklch: 'oklch(50.8% 0.144 164.215)', hex: '#047857', l: 0.508, c: 0.144, h: 164.215 },
  'var(--color-emerald-600)': { oklch: 'oklch(59.6% 0.145 163.225)', hex: '#059669', l: 0.596, c: 0.145, h: 163.225 },
  'var(--color-amber-500)': { oklch: 'oklch(76.9% 0.188 70.08)', hex: '#f59e0b', l: 0.769, c: 0.188, h: 70.08 },
  'var(--color-amber-950)': { oklch: 'oklch(27.9% 0.077 45.635)', hex: '#451a03', l: 0.279, c: 0.077, h: 45.635 },
  'var(--color-sky-700)': { oklch: 'oklch(50% 0.134 242.749)', hex: '#0369a1', l: 0.50, c: 0.134, h: 242.749 },
  'var(--color-sky-600)': { oklch: 'oklch(58.8% 0.158 241.966)', hex: '#0284c7', l: 0.588, c: 0.158, h: 241.966 },

  'var(--color-violet-500)': { oklch: 'oklch(60.6% 0.25 292.717)', hex: '#8b5cf6', l: 0.606, c: 0.25, h: 292.717 },
  'var(--color-emerald-500)': { oklch: 'oklch(69.6% 0.17 162.48)', hex: '#10b981', l: 0.696, c: 0.17, h: 162.48 },
  'var(--color-rose-500)': { oklch: 'oklch(64.5% 0.246 16.439)', hex: '#f43f5e', l: 0.645, c: 0.246, h: 16.439 },
  'var(--color-cyan-500)': { oklch: 'oklch(71.5% 0.143 215.221)', hex: '#06b6d4', l: 0.715, c: 0.143, h: 215.221 },
  'var(--color-orange-500)': { oklch: 'oklch(70.5% 0.213 47.604)', hex: '#f97316', l: 0.705, c: 0.213, h: 47.604 },
  'var(--color-slate-500)': { oklch: 'oklch(55.4% 0.046 257.417)', hex: '#64748b', l: 0.554, c: 0.046, h: 257.417 },
  'rgb(0 0 0 / 0.4)': { oklch: 'oklch(0% 0 0 / 0.4)', hex: '#00000066', l: 0, c: 0, h: 0 }
};

function parseOklch(str) {
  if (!str) return null;
  const match = str.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
  if (!match) return null;
  const lRaw = parseFloat(match[1]);
  const l = str.includes('%') ? lRaw / 100 : lRaw > 1 ? lRaw / 100 : lRaw;
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;
  return { l, c, h, a };
}

function oklchToRgb(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  function toSrgb(val) {
    const clamped = Math.max(0, Math.min(1, val));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  }

  return [toSrgb(rLin), toSrgb(gLin), toSrgb(bLin)];
}

function relLuminance(r, g, b) {
  function lin(val) {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(lum1, lum2) {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

function resolveColor(val) {
  if (!val) return null;
  val = val.trim();
  if (PALETTE_FALLBACKS[val]) {
    const f = PALETTE_FALLBACKS[val];
    const rgb = oklchToRgb(f.l, f.c, f.h);
    const lum = relLuminance(...rgb);
    return { raw: val, oklch: f.oklch, lum };
  }
  const parsed = parseOklch(val);
  if (parsed) {
    const rgb = oklchToRgb(parsed.l, parsed.c, parsed.h);
    const lum = relLuminance(...rgb);
    return { raw: val, oklch: val, lum };
  }
  if (val.startsWith('#ffffff') || val === 'white') {
    return { raw: val, oklch: 'oklch(100% 0 0)', lum: 1.0 };
  }
  return { raw: val, oklch: val, lum: 0.5 };
}

function extractTokens(cssText) {
  const tokens = {};
  const lines = cssText.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*(--color-[a-z0-9-]+)\s*:\s*([^;]+);/);
    if (m) {
      tokens[m[1]] = m[2].trim().replace(/\s*\/\*.*?\*\//g, '').trim();
    }
  }
  return tokens;
}

const themeCss = readFileSync(themePath, 'utf-8');
const darkCss = readFileSync(darkPath, 'utf-8');

const lightTokens = extractTokens(themeCss);
const darkTokens = extractTokens(darkCss);

const TOKEN_CATEGORIES = [
  {
    role: 'Surfaces',
    description: 'Foundation canvas and container layers for cards, modals, and popovers.',
    tokens: ['--color-background', '--color-foreground', '--color-card', '--color-card-foreground', '--color-popover', '--color-popover-foreground']
  },
  {
    role: 'Actions',
    description: 'Interactive buttons, active toggles, links, and selectable states.',
    tokens: ['--color-primary', '--color-primary-hover', '--color-primary-foreground', '--color-secondary', '--color-secondary-hover', '--color-secondary-foreground']
  },
  {
    role: 'Subtle UI',
    description: 'Secondary accents, muted indicators, ghost hover fills, and subdued text.',
    tokens: ['--color-muted', '--color-muted-foreground', '--color-accent', '--color-accent-foreground']
  },
  {
    role: 'Status',
    description: 'Semantic state indicators for destructive alerts, success confirmation, warning banners, and informational callouts.',
    tokens: [
      '--color-destructive', '--color-destructive-hover', '--color-destructive-foreground',
      '--color-success', '--color-success-foreground',
      '--color-warning', '--color-warning-foreground',
      '--color-info', '--color-info-foreground'
    ]
  },
  {
    role: 'Lines & Focus',
    description: 'Structural component borders, form input dividers, and keyboard focus rings.',
    tokens: ['--color-border', '--color-input', '--color-ring', '--color-overlay']
  },
  {
    role: 'App Shell',
    description: 'Navigation chrome, collapsible sidebars, application rails, and top bars.',
    tokens: [
      '--color-sidebar', '--color-sidebar-foreground', '--color-sidebar-muted-foreground',
      '--color-sidebar-accent', '--color-sidebar-accent-foreground',
      '--color-sidebar-primary', '--color-sidebar-primary-foreground',
      '--color-sidebar-border', '--color-sidebar-ring'
    ]
  },
  {
    role: 'Data Visualisation',
    description: 'Categorical series palette optimized for chart sequences, gauges, and sparklines.',
    tokens: [
      '--color-chart-1', '--color-chart-2', '--color-chart-3', '--color-chart-4',
      '--color-chart-5', '--color-chart-6', '--color-chart-7', '--color-chart-8'
    ]
  }
];

// Build Token Reference list
const tokenList = [];
for (const cat of TOKEN_CATEGORIES) {
  for (const tokenName of cat.tokens) {
    const lightRaw = lightTokens[tokenName] || 'inherit';
    const darkRaw = darkTokens[tokenName] || lightRaw;
    const lightResolved = resolveColor(lightRaw);
    const darkResolved = resolveColor(darkRaw);

    tokenList.push({
      name: tokenName,
      shortName: tokenName.replace(/^--color-/, ''),
      category: cat.role,
      lightValue: lightResolved?.oklch || lightRaw,
      darkValue: darkResolved?.oklch || darkRaw,
      lightRaw,
      darkRaw
    });
  }
}

// Contrast verification pairs
const CONTRAST_PAIRS = [
  {
    name: 'Body text on background',
    textToken: '--color-foreground',
    bgToken: '--color-background',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Card text on card surface',
    textToken: '--color-card-foreground',
    bgToken: '--color-card',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Primary button label on primary',
    textToken: '--color-primary-foreground',
    bgToken: '--color-primary',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Secondary button label on secondary',
    textToken: '--color-secondary-foreground',
    bgToken: '--color-secondary',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Muted text on muted container',
    textToken: '--color-muted-foreground',
    bgToken: '--color-muted',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Muted text on page background',
    textToken: '--color-muted-foreground',
    bgToken: '--color-background',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Accent text on accent surface',
    textToken: '--color-accent-foreground',
    bgToken: '--color-accent',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Destructive label on destructive fill',
    textToken: '--color-destructive-foreground',
    bgToken: '--color-destructive',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Success text on success fill',
    textToken: '--color-success-foreground',
    bgToken: '--color-success',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Warning text on warning fill',
    textToken: '--color-warning-foreground',
    bgToken: '--color-warning',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Info text on info fill',
    textToken: '--color-info-foreground',
    bgToken: '--color-info',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Sidebar item text on sidebar',
    textToken: '--color-sidebar-foreground',
    bgToken: '--color-sidebar',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Sidebar muted text on sidebar',
    textToken: '--color-sidebar-muted-foreground',
    bgToken: '--color-sidebar',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  },
  {
    name: 'Sidebar primary active item label',
    textToken: '--color-sidebar-primary-foreground',
    bgToken: '--color-sidebar-primary',
    requirement: 'WCAG AA Normal Text (>= 4.5:1)',
    minRatio: 4.5
  }
];

const contrastTable = [];
for (const pair of CONTRAST_PAIRS) {
  const lightText = resolveColor(lightTokens[pair.textToken]);
  const lightBg = resolveColor(lightTokens[pair.bgToken]);
  const darkText = resolveColor(darkTokens[pair.textToken] || lightTokens[pair.textToken]);
  const darkBg = resolveColor(darkTokens[pair.bgToken] || lightTokens[pair.bgToken]);

  const lightRatio = lightText && lightBg ? contrastRatio(lightText.lum, lightBg.lum) : 1;
  const darkRatio = darkText && darkBg ? contrastRatio(darkText.lum, darkBg.lum) : 1;

  contrastTable.push({
    name: pair.name,
    textToken: pair.textToken,
    bgToken: pair.bgToken,
    requirement: pair.requirement,
    minRatio: pair.minRatio,
    light: {
      ratio: parseFloat(lightRatio.toFixed(2)),
      formatted: `${lightRatio.toFixed(2)}:1`,
      pass: lightRatio >= pair.minRatio
    },
    dark: {
      ratio: parseFloat(darkRatio.toFixed(2)),
      formatted: `${darkRatio.toFixed(2)}:1`,
      pass: darkRatio >= pair.minRatio
    }
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  categories: TOKEN_CATEGORIES,
  tokens: tokenList,
  contrastPairs: contrastTable
};

writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`✓ Generated token reference and contrast table (${tokenList.length} tokens, ${contrastTable.length} contrast pairs) -> ${outputPath}`);
