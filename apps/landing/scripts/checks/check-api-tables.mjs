import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const repoRoot = join(landingRoot, '..', '..');
const docsRoot = join(landingRoot, 'content', 'docs');
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

export function runApiTablesCheck(options = { enforce: false }) {
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
  const components = apiData.components || {};

  const mdxFiles = getMdxFiles(docsRoot);
  const errors = [];
  const apiTableRegex = /<ApiTable\s+[^>]*components=\{?\[([^\]]+)\]\}?/g;

  for (const file of mdxFiles) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
      let match;
      while ((match = apiTableRegex.exec(lineText)) !== null) {
        const comps = match[1].match(/['"]([^'"]+)['"]/g) || [];
        for (const rawComp of comps) {
          const compName = rawComp.replace(/['"]/g, '');
          if (!components[compName]) {
            errors.push({
              file: relative(landingRoot, file),
              line: lineIdx + 1,
              message: `<ApiTable> references "${compName}" which does not exist in packages/ui/dist/api.json`,
            });
          } else {
            const props = components[compName].props || {};
            const propKeys = Object.keys(props);
            if (propKeys.length === 0) {
              errors.push({
                file: relative(landingRoot, file),
                line: lineIdx + 1,
                message: `<ApiTable> references "${compName}" which has 0 documented props in api.json`,
              });
            }
          }
        }
      }
    });
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isEnforce = process.argv.includes('--enforce');
  const errs = runApiTablesCheck({ enforce: isEnforce });

  if (errs.length > 0) {
    console.log(`API Tables check (mode: ${isEnforce ? 'ENFORCE' : 'REPORT'}): ${errs.length} issues found.`);
    for (const e of errs.slice(0, 10)) {
      console.log(`  ${e.file}:${e.line} - ${e.message}`);
    }
    if (errs.length > 10) {
      console.log(`  ...and ${errs.length - 10} more.`);
    }
    if (isEnforce) process.exit(1);
  } else {
    console.log('✓ All components referenced in <ApiTable> exist in api.json with props.');
  }
}
