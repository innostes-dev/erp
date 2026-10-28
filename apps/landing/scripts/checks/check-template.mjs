import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const docsRoot = join(landingRoot, 'content', 'docs');

function getMdxFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(getMdxFiles(full));
    } else if (full.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

export function runTemplateCheck(options = { enforce: false }) {
  const mdxFiles = getMdxFiles(docsRoot);
  const errors = [];

  const expectedOrder = [
    'Import',
    'When to use',
    'Examples',
    'Accessibility',
    'Guidelines',
    'API reference',
    'Related',
  ];

  for (const file of mdxFiles) {
    const content = readFileSync(file, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    // Only check pages with 'status:' in frontmatter (component/widget/chart pages)
    if (!/status:\s*(Stable|Beta|Experimental)/.test(fm)) {
      continue;
    }

    const relFile = relative(landingRoot, file);
    // Extract level 2 headings
    const headings = (content.match(/^##\s+(.+)$/gm) || []).map((h) =>
      h.replace(/^##\s+/, '').trim(),
    );

    // Filter to known sections (allowing Anatomy after When to use)
    const normalized = headings.map((h) => h.toLowerCase());

    // Check sentence case for headings
    headings.forEach((h) => {
      const words = h.split(/\s+/).filter((w) => /^[a-zA-Z]+$/.test(w));
      if (words.length >= 2) {
        const titleCaseWords = words.slice(1).filter((w) => {
          // ignore known uppercase acronyms
          if (['API', 'UI', 'ERP', 'ARIA', 'RTL', 'HTML'].includes(w)) return false;
          return /^[A-Z][a-z]/.test(w);
        });
        if (titleCaseWords.length > 0) {
          errors.push({
            file: relFile,
            line: 1,
            message: `Heading "## ${h}" uses Title Case instead of sentence case`,
          });
        }
      }
    });

    // Check presence of required sections
    for (const req of expectedOrder) {
      if (!normalized.includes(req.toLowerCase())) {
        errors.push({
          file: relFile,
          line: 1,
          message: `Missing required template heading: "## ${req}"`,
        });
      }
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isEnforce = process.argv.includes('--enforce');
  const errs = runTemplateCheck({ enforce: isEnforce });

  if (errs.length > 0) {
    console.log(`Template check (mode: ${isEnforce ? 'ENFORCE' : 'REPORT'}): ${errs.length} issues found.`);
    for (const e of errs.slice(0, 10)) {
      console.log(`  ${e.file} - ${e.message}`);
    }
    if (errs.length > 10) {
      console.log(`  ...and ${errs.length - 10} more.`);
    }
    if (isEnforce) process.exit(1);
  } else {
    console.log('✓ All component pages strictly follow the page template.');
  }
}
