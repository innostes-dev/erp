import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const contentRoot = join(landingRoot, 'content');

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

export function runMdxSafetyCheck() {
  const files = getMdxFiles(contentRoot);
  const errors = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relFile = relative(landingRoot, file);

    let inCodeBlock = false;
    let inFrontmatter = false;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      if (idx === 0 && line.trim() === '---') {
        inFrontmatter = true;
        return;
      }
      if (inFrontmatter) {
        if (line.trim() === '---') {
          inFrontmatter = false;
        }
        return;
      }

      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      if (inCodeBlock) return;

      // Skip JSX lines or import statements
      if (/^\s*import\s+/.test(line)) return;
      if (/^\s*export\s+/.test(line)) return;

      // Remove code spans
      let prose = line.replace(/`[^`]+`/g, '');
      // Remove valid MDX / JSX self-closing or paired tags with standard attributes
      // e.g. <Component ... /> or </Component> or <Component>
      prose = prose.replace(/<\/?([A-Z][a-zA-Z0-9]*|Cards|Card|Steps|Step|Tabs|Tab|Files|Folder|File|Callout|ComponentPreview|ApiTable)[^>]*>/g, '');

      // Check for stray unescaped {var} or {tag} in prose
      const curlyMatch = /\{([a-zA-Z0-9_\-\.]+)\}/.exec(prose);
      if (curlyMatch && !line.includes('{/*')) {
        errors.push({
          file: relFile,
          line: lineNum,
          message: `Unescaped curly braces "{${curlyMatch[1]}}" in prose. MDX will interpret this as JavaScript. Wrap it in a code span: \`{${curlyMatch[1]}}\`.`,
        });
      }
    });
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runMdxSafetyCheck();
  if (errs.length > 0) {
    console.error(`MDX safety check failed: ${errs.length} issues found.`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All MDX files are safe from unescaped prose braces.');
  }
}
