import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const docsRoot = join(landingRoot, 'content', 'docs');

function getComponentMdxFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(getComponentMdxFiles(full));
    } else if (full.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

export function runFrontmatterCheck(options = { enforce: false }) {
  const folders = [
    join(docsRoot, 'components'),
    join(docsRoot, 'widgets'),
    join(docsRoot, 'charts'),
  ];

  let files = [];
  for (const folder of folders) {
    files = files.concat(getComponentMdxFiles(folder));
  }

  const errors = [];
  const requiredFields = ['title', 'description', 'icon', 'status', 'summary'];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const relFile = relative(landingRoot, file);

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
          message: `Missing required frontmatter field: "${req}"`,
        });
      }
    }

    // Check description: one sentence ending with full stop
    if (fields.description) {
      const desc = fields.description.trim();
      if (!desc.endsWith('.')) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Frontmatter description does not end with a full stop: "${desc}"`,
        });
      }
      // Check one sentence: no intermediate periods followed by uppercase
      if (/[.!?]\s+[A-Z]/.test(desc)) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Frontmatter description should be one sentence, but contains multiple: "${desc}"`,
        });
      }
    }

    // Check status value
    if (fields.status && !['Stable', 'Beta', 'Experimental'].includes(fields.status)) {
      errors.push({
        file: relFile,
        line: 1,
        message: `Invalid status "${fields.status}". Must be Stable, Beta, or Experimental.`,
      });
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isEnforce = process.argv.includes('--enforce');
  const errs = runFrontmatterCheck({ enforce: isEnforce });

  if (errs.length > 0) {
    console.log(`Frontmatter check (mode: ${isEnforce ? 'ENFORCE' : 'REPORT'}): ${errs.length} issues found.`);
    for (const e of errs.slice(0, 10)) {
      console.log(`  ${e.file}:${e.line} - ${e.message}`);
    }
    if (errs.length > 10) {
      console.log(`  ...and ${errs.length - 10} more.`);
    }
    if (isEnforce) process.exit(1);
  } else {
    console.log('✓ All component, widget, and chart frontmatters are complete and valid.');
  }
}
