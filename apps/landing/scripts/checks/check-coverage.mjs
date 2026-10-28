import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const repoRoot = join(landingRoot, '..', '..');
const docsRoot = join(landingRoot, 'content', 'docs');
const allowlistPath = join(__dirname, 'docs-coverage-allowlist.json');
const apiJsonPath = join(repoRoot, 'packages', 'ui', 'dist', 'api.json');

function getMdxFiles(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
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

export function runCoverageCheck(options = { enforce: false }) {
  if (!existsSync(apiJsonPath)) {
    return [
      {
        file: 'packages/ui/dist/api.json',
        line: 1,
        message: 'api.json does not exist. Run pnpm nx build ui first.',
      },
    ];
  }

  const apiData = JSON.parse(readFileSync(apiJsonPath, 'utf8'));
  const exportedComponents = Object.keys(apiData.components || {});

  const allowlist = existsSync(allowlistPath)
    ? JSON.parse(readFileSync(allowlistPath, 'utf8'))
    : {};

  const mdxFiles = getMdxFiles(docsRoot);
  const documentedComponents = new Set();
  const apiTableRegex = /<ApiTable\s+[^>]*components=\{?\[([^\]]+)\]\}?/g;

  for (const file of mdxFiles) {
    const content = readFileSync(file, 'utf8');
    let match;
    while ((match = apiTableRegex.exec(content)) !== null) {
      const comps = match[1].match(/['"]([^'"]+)['"]/g) || [];
      for (const c of comps) {
        documentedComponents.add(c.replace(/['"]/g, ''));
      }
    }
  }

  const errors = [];
  for (const comp of exportedComponents) {
    if (!documentedComponents.has(comp) && !allowlist[comp]) {
      errors.push({
        file: 'packages/ui/dist/api.json',
        line: 1,
        message: `Exported component "${comp}" is not documented in any <ApiTable components> and not in docs-coverage-allowlist.json`,
      });
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isEnforce = process.argv.includes('--enforce');
  const errs = runCoverageCheck({ enforce: isEnforce });

  if (errs.length > 0) {
    console.log(`Coverage check (mode: ${isEnforce ? 'ENFORCE' : 'REPORT'}): ${errs.length} undocumented symbols.`);
    for (const e of errs.slice(0, 10)) {
      console.log(`  ${e.message}`);
    }
    if (errs.length > 10) {
      console.log(`  ...and ${errs.length - 10} more.`);
    }
    if (isEnforce) process.exit(1);
  } else {
    console.log('✓ All exported components are covered by <ApiTable> or allowlisted.');
  }
}
