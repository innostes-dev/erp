import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const decisionsRoot = join(landingRoot, 'content', 'dev-docs', 'architecture', 'decisions');

const ALLOWED_STATUS_PREFIXES = [
  'proposed',
  'accepted',
  'deprecated',
  'superseded by',
  'superseded',
];

const REQUIRED_SECTIONS = [
  'Context and Problem Statement',
  'Decision Drivers',
  'Considered Options',
  'Decision Outcome',
  'Consequences',
  'Confirmation',
];

export function runAdrCheck() {
  const errors = [];
  const warnings = [];

  if (!existsSync(decisionsRoot)) {
    return { checkedCount: 0, errors: [], warnings: [{ message: 'Decisions directory does not exist yet (pending Prompt 09)' }], passed: true };
  }

  const files = readdirSync(decisionsRoot).filter(
    (f) => f.endsWith('.mdx') && !['index.mdx', 'meta.json'].includes(f)
  );

  const adrNumbers = new Set();
  const fileMap = new Map();

  // Check file naming and numbering (R2: NNNN-kebab-title.mdx)
  for (const file of files) {
    const fullPath = join(decisionsRoot, file);
    const relFile = relative(landingRoot, fullPath);
    const m = file.match(/^(\d{4})-([a-z0-9-]+)\.mdx$/);
    if (!m) {
      errors.push({
        file: relFile,
        line: 1,
        message: `Filename "${file}" does not match MADR naming convention NNNN-kebab-title.mdx (R2)`,
      });
      continue;
    }

    const num = m[1];
    if (adrNumbers.has(num)) {
      errors.push({
        file: relFile,
        line: 1,
        message: `Duplicate ADR number "${num}" found in "${file}"`,
      });
    }
    adrNumbers.add(num);
    fileMap.set(num, file);
  }

  // Validate MADR structure (R1), statuses (R3), and references
  for (const file of files) {
    const fullPath = join(decisionsRoot, file);
    const relFile = relative(landingRoot, fullPath);
    const content = readFileSync(fullPath, 'utf8');

    // Check status
    const statusMatch = content.match(/Status\s*:\s*([^\n]+)/i) || content.match(/\*\*Status\*\*:\s*([^\n]+)/i);
    if (!statusMatch) {
      errors.push({
        file: relFile,
        line: 1,
        message: 'Missing "Status:" field in ADR (R1, R3)',
      });
    } else {
      const statusText = statusMatch[1].trim().toLowerCase();
      const isValidStatus = ALLOWED_STATUS_PREFIXES.some((prefix) => statusText.startsWith(prefix));
      if (!isValidStatus) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Invalid ADR status "${statusMatch[1].trim()}". Allowed: proposed, accepted, deprecated, superseded by NNNN (R3)`,
        });
      }

      // Check superseded by link (R6)
      if (statusText.includes('superseded by')) {
        const targetMatch = statusText.match(/superseded by\s+(?:ADR-)?(\d{4})/i);
        if (targetMatch) {
          const targetNum = targetMatch[1];
          if (!fileMap.has(targetNum)) {
            errors.push({
              file: relFile,
              line: 1,
              message: `ADR is marked "superseded by ${targetNum}", but ADR ${targetNum} does not exist in decisions folder (R6)`,
            });
          }
        }
      }
    }

    // Check required sections (R1)
    for (const section of REQUIRED_SECTIONS) {
      const sectionRegex = new RegExp(`##\\s+.*${section}`, 'i');
      if (!sectionRegex.test(content)) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Missing MADR section "## ${section}" (R1)`,
        });
      }
    }
  }

  // Check index / meta.json lists all ADRs
  const metaPath = join(decisionsRoot, 'meta.json');
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      const registeredPages = new Set(meta.pages || []);
      for (const file of files) {
        const slug = file.replace(/\.mdx$/, '');
        if (!registeredPages.has(slug)) {
          warnings.push({
            file: relative(landingRoot, metaPath),
            line: 1,
            message: `ADR "${slug}" is not listed in decisions/meta.json pages`,
          });
        }
      }
    } catch (e) {
      errors.push({
        file: relative(landingRoot, metaPath),
        line: 1,
        message: `Failed to parse decisions/meta.json: ${e.message}`,
      });
    }
  }

  return {
    checkedCount: files.length,
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runAdrCheck();
  console.log(`Checked ${result.checkedCount} ADR file(s).`);
  for (const w of result.warnings) {
    console.warn(`[WARN] ${w.file || 'ADR Gate'}: ${w.message}`);
  }
  if (result.errors.length > 0) {
    console.error(`Found ${result.errors.length} ADR gate error(s):`);
    for (const err of result.errors) {
      console.error(`  ${err.file}:${err.line} - ${err.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All ADR checks passed.');
    process.exit(0);
  }
}
