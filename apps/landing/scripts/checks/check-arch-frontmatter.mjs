import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const contentRoot = join(landingRoot, 'content', 'dev-docs');
const archRoot = join(contentRoot, 'architecture');
const opsRoot = join(contentRoot, 'operations');

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
    // Directory might not exist yet
  }
  return results;
}

export function runArchFrontmatterCheck(options = { maxAgeDays: 180, enforce: false }) {
  const files = [...getMdxFiles(archRoot), ...getMdxFiles(opsRoot)];
  const errors = [];
  const warnings = [];
  const requiredFields = ['title', 'description', 'icon', 'owner', 'lastReviewed'];
  const now = new Date();

  for (const file of files) {
    const relFile = relative(landingRoot, file);
    // Ignore decision ADR files from this check since ADRs have their own frontmatter / MADR schema
    if (relFile.includes('/decisions/')) continue;

    const content = readFileSync(file, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!fmMatch) {
      errors.push({
        file: relFile,
        line: 1,
        message: 'Missing YAML frontmatter block',
      });
      continue;
    }

    const fm = fmMatch[1];
    const fields = {};
    for (const line of fm.split('\n')) {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        fields[key] = val;
      }
    }

    // Check required fields
    for (const req of requiredFields) {
      if (!fields[req]) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Missing required architecture frontmatter field: "${req}" (A1)`,
        });
      }
    }

    // Validate lastReviewed date
    if (fields.lastReviewed) {
      const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoRegex.test(fields.lastReviewed)) {
        errors.push({
          file: relFile,
          line: 1,
          message: `lastReviewed "${fields.lastReviewed}" is not an ISO date (YYYY-MM-DD)`,
        });
      } else {
        const revDate = new Date(fields.lastReviewed);
        const ageDays = (now.getTime() - revDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > (options.maxAgeDays || 180)) {
          const msg = `lastReviewed is ${Math.round(ageDays)} days old (exceeds ${options.maxAgeDays} days limit)`;
          if (options.enforce) {
            errors.push({ file: relFile, line: 1, message: msg });
          } else {
            warnings.push({ file: relFile, line: 1, message: msg });
          }
        }
      }
    }
  }

  return {
    checkedFiles: files.length,
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runArchFrontmatterCheck();
  console.log(`Checked ${result.checkedFiles} architecture/operations page(s).`);
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`[WARN] ${w.file}:${w.line} - ${w.message}`);
    }
  }
  if (result.errors.length > 0) {
    console.error(`Found ${result.errors.length} frontmatter error(s):`);
    for (const err of result.errors) {
      console.error(`  ${err.file}:${err.line} - ${err.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All architecture frontmatter valid.');
    process.exit(0);
  }
}
