import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const contentRoot = join(landingRoot, 'content');

function findMetaFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(findMetaFiles(full));
    } else if (item === 'meta.json') {
      results.push(full);
    }
  }
  return results;
}

export function runSidebarCheck() {
  const metaFiles = findMetaFiles(contentRoot);
  const errors = [];

  for (const metaPath of metaFiles) {
    const folder = dirname(metaPath);
    let metaContent;
    try {
      metaContent = JSON.parse(readFileSync(metaPath, 'utf8'));
    } catch (e) {
      errors.push({
        file: relative(landingRoot, metaPath),
        line: 1,
        message: `Invalid JSON in meta.json: ${e.message}`,
      });
      continue;
    }

    const pages = metaContent.pages || [];
    const listedItems = new Set();

    for (const p of pages) {
      if (typeof p !== 'string') continue;
      if (p.startsWith('---') && p.endsWith('---')) continue; // separator

      if (p.startsWith('...')) {
        const sub = p.slice(3);
        const subFolder = join(folder, sub);
        if (!existsSync(subFolder)) {
          errors.push({
            file: relative(landingRoot, metaPath),
            line: 1,
            message: `meta.json references non-existent folder expansion "...${sub}"`,
          });
        }
        listedItems.add(sub);
      } else {
        const itemMdx = join(folder, `${p}.mdx`);
        const itemDir = join(folder, p);
        if (!existsSync(itemMdx) && !existsSync(itemDir)) {
          errors.push({
            file: relative(landingRoot, metaPath),
            line: 1,
            message: `meta.json lists page "${p}" which has no corresponding file or folder`,
          });
        }
        listedItems.add(p);
      }
    }

    // Check that every .mdx file in folder is in meta.json
    for (const item of readdirSync(folder)) {
      if (item.endsWith('.mdx')) {
        const base = item.replace(/\.mdx$/, '');
        if (!listedItems.has(base)) {
          errors.push({
            file: relative(landingRoot, join(folder, item)),
            line: 1,
            message: `Page "${item}" exists on disk but is not listed in ${relative(landingRoot, metaPath)}`,
          });
        }
      }
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runSidebarCheck();
  if (errs.length > 0) {
    console.error(`Sidebar check failed: ${errs.length} issues found.`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All pages are listed in meta.json and all meta entries exist.');
  }
}
