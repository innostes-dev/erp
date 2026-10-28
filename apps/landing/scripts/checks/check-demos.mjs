import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const contentRoot = join(landingRoot, 'content');
const demosDir = join(landingRoot, 'components', 'demos');

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

function getAllDemoFiles(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(getAllDemoFiles(full));
    } else if (full.endsWith('.tsx') && !item.startsWith('_') && item !== 'registry.ts') {
      results.push(full);
    }
  }
  return results;
}

export function runDemoCheck() {
  const mdxFiles = getMdxFiles(contentRoot);
  const allDemos = getAllDemoFiles(demosDir);
  const referencedDemos = new Set();
  const errors = [];

  const previewRegex = /<ComponentPreview\s+[^>]*name=["']([^"']+)["']/g;

  for (const file of mdxFiles) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
      let match;
      while ((match = previewRegex.exec(lineText)) !== null) {
        const demoName = match[1];
        referencedDemos.add(demoName);

        const demoFile = join(demosDir, `${demoName}.tsx`);
        if (!existsSync(demoFile)) {
          errors.push({
            file: relative(landingRoot, file),
            line: lineIdx + 1,
            message: `Referenced demo file "${demoName}.tsx" does not exist in components/demos/`,
          });
        }
      }
    });
  }

  // Check for unused demos
  for (const demoPath of allDemos) {
    const relName = relative(demosDir, demoPath).replace(/\\/g, '/').replace(/\.tsx$/, '');
    if (!referencedDemos.has(relName)) {
      errors.push({
        file: relative(landingRoot, demoPath),
        line: 1,
        message: `Unreferenced demo file: "${relName}". Every demo must be used in at least one documentation page.`,
      });
    }
  }

  // Check imports in demo files
  const allowedImports = [
    '@innostes/ui',
    '@innostes/ui/charts',
    '@innostes/ui/editor',
    'react',
    'lucide-react',
  ];

  const importRegex = /import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/g;

  for (const demoPath of allDemos) {
    const content = readFileSync(demoPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
      let match;
      while ((match = importRegex.exec(lineText)) !== null) {
        const imp = match[1];
        // Allow relative import to _data or sibling helpers inside demos
        if (imp.startsWith('.')) {
          // Check if it's within demos directory
          continue;
        }

        const isAllowed = allowedImports.some(
          (allowed) => imp === allowed || imp.startsWith(`${allowed}/`),
        );

        if (!isAllowed) {
          errors.push({
            file: relative(landingRoot, demoPath),
            line: lineIdx + 1,
            message: `Illegal import "${imp}". Demos may only import from @innostes/ui, @innostes/ui/charts, @innostes/ui/editor, react, lucide-react, or local demo data.`,
          });
        }
      }
    });
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runDemoCheck();
  if (errs.length > 0) {
    console.error(`Demo check failed: ${errs.length} issues found.`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All demos are referenced, exist, and use allowed imports.');
  }
}
