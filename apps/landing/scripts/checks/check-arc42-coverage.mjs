import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const archRoot = join(landingRoot, 'content', 'dev-docs', 'architecture');

const ARC42_SECTIONS = [
  { id: 1, name: 'Introduction and Goals' },
  { id: 2, name: 'Architecture Constraints' },
  { id: 3, name: 'System Scope and Context' },
  { id: 4, name: 'Solution Strategy' },
  { id: 5, name: 'Building Block View' },
  { id: 6, name: 'Runtime View' },
  { id: 7, name: 'Deployment View' },
  { id: 8, name: 'Cross-cutting Concepts' },
  { id: 9, name: 'Architecture Decisions' },
  { id: 10, name: 'Quality Requirements' },
  { id: 11, name: 'Risks and Technical Debt' },
  { id: 12, name: 'Glossary' },
];

function getMdxFiles(dir) {
  let results = [];
  try {
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      if (statSync(full).isDirectory()) {
        results = results.concat(getMdxFiles(full));
      } else if (full.endsWith('.mdx')) {
        results.push(full);
      }
    }
  } catch {
    // Directory might not exist
  }
  return results;
}

export function runArc42CoverageCheck(options = { enforceAll: false }) {
  const files = getMdxFiles(archRoot);
  const coveredSections = new Map(); // sectionId -> list of files
  const errors = [];
  const warnings = [];

  for (const s of ARC42_SECTIONS) {
    coveredSections.set(s.id, []);
  }

  for (const file of files) {
    const relFile = relative(landingRoot, file);
    const content = readFileSync(file, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const arc42Match = fm.match(/arc42\s*:\s*(.+)/);
    if (arc42Match) {
      let rawVal = arc42Match[1].trim();
      let sectionIds = [];
      if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        sectionIds = rawVal
          .slice(1, -1)
          .split(',')
          .map((v) => parseInt(v.trim(), 10))
          .filter((v) => !isNaN(v));
      } else {
        const parsed = parseInt(rawVal, 10);
        if (!isNaN(parsed)) sectionIds.push(parsed);
      }

      for (const id of sectionIds) {
        if (coveredSections.has(id)) {
          coveredSections.get(id).push(relFile);
        }
      }
    }
  }

  const uncovered = [];
  for (const s of ARC42_SECTIONS) {
    const pages = coveredSections.get(s.id);
    if (!pages || pages.length === 0) {
      uncovered.push(s);
    }
  }

  if (uncovered.length > 0) {
    const msg = `Uncovered arc42 sections (${uncovered.length}/12): ${uncovered.map((s) => `§${s.id} ${s.name}`).join(', ')}`;
    if (options.enforceAll) {
      errors.push({ message: msg });
    } else {
      warnings.push({ message: msg });
    }
  }

  return {
    coveredCount: ARC42_SECTIONS.length - uncovered.length,
    totalSections: ARC42_SECTIONS.length,
    uncovered,
    coveredSections,
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const enforce = process.argv.includes('--enforce');
  const result = runArc42CoverageCheck({ enforceAll: enforce });
  console.log(`arc42 coverage: ${result.coveredCount}/12 sections covered.`);
  for (const [id, pages] of result.coveredSections.entries()) {
    const sec = ARC42_SECTIONS.find((s) => s.id === id);
    if (pages.length > 0) {
      console.log(`  ✓ §${id} ${sec.name}: ${pages.join(', ')}`);
    } else {
      console.log(`  - §${id} ${sec.name}: (pending)`);
    }
  }
  if (result.errors.length > 0) {
    for (const e of result.errors) console.error(`[ERROR] ${e.message}`);
    process.exit(1);
  }
  process.exit(0);
}
