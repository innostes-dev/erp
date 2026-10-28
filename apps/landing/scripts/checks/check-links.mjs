import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const contentRoot = join(landingRoot, 'content');
const docsRoot = join(contentRoot, 'docs');
const devDocsRoot = join(contentRoot, 'dev-docs');

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

export function runLinkCheck() {
  const mdxFiles = [...getMdxFiles(docsRoot), ...getMdxFiles(devDocsRoot)];
  const pages = new Map();

  for (const file of mdxFiles) {
    const rel = relative(contentRoot, file).replace(/\\/g, '/').replace(/\.mdx$/, '');
    const parts = rel.split('/');
    let url = '';
    if (parts[0] === 'docs') {
      const sub = parts.slice(1);
      if (sub.length === 1 && sub[0] === 'index') {
        url = '/ui/docs';
      } else if (sub[sub.length - 1] === 'index') {
        url = '/ui/docs/' + sub.slice(0, -1).join('/');
      } else {
        url = '/ui/docs/' + sub.join('/');
      }
    } else if (parts[0] === 'dev-docs') {
      const sub = parts.slice(1);
      if (sub.length === 1 && sub[0] === 'index') {
        url = '/docs';
      } else if (sub[sub.length - 1] === 'index') {
        url = '/docs/' + sub.slice(0, -1).join('/');
      } else {
        url = '/docs/' + sub.join('/');
      }
    }

    const content = readFileSync(file, 'utf8');
    // Extract heading anchors matching Fumadocs / Github slug algorithm
    const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    const anchors = new Set();
    for (const h of headings) {
      const raw = h.replace(/^#{1,6}\s+/, '').trim();
      // Remove inline code ticks or markdown links from anchor text
      const clean = raw.replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      const slug = clean
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      anchors.add(slug);
    }

    pages.set(url, { file, anchors, content });
  }

  const errors = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const [pageUrl, data] of pages.entries()) {
    const { file, content, anchors } = data;
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
      // Skip commented lines
      if (lineText.trim().startsWith('{/*') && lineText.trim().endsWith('*/}')) return;

      let match;
      while ((match = linkRegex.exec(lineText)) !== null) {
        const [_, text, href] = match;
        // Ignore external or email links
        if (/^(https?:|mailto:|ftp:)/i.test(href)) {
          // Syntax check only
          try {
            new URL(href);
          } catch {
            errors.push({
              file: relative(landingRoot, file),
              line: lineIdx + 1,
              message: `Malformed external link syntax: ${href}`,
            });
          }
          continue;
        }

        if (href.startsWith('#')) {
          const anchor = href.slice(1);
          if (anchor && !anchors.has(anchor)) {
            errors.push({
              file: relative(landingRoot, file),
              line: lineIdx + 1,
              message: `Broken internal anchor #${anchor} on page ${pageUrl}`,
            });
          }
        } else if (href.startsWith('/')) {
          const [targetPath, targetAnchor] = href.split('#');
          const cleanTarget = targetPath === '/' ? '/' : targetPath.replace(/\/$/, '');

          if (!pages.has(cleanTarget)) {
            // Check if it's a known static route or dev link
            if (!cleanTarget.startsWith('/_next') && !cleanTarget.startsWith('/api')) {
              errors.push({
                file: relative(landingRoot, file),
                line: lineIdx + 1,
                message: `Broken internal link: ${href} (page ${cleanTarget} does not exist)`,
              });
            }
          } else if (targetAnchor) {
            const targetPage = pages.get(cleanTarget);
            if (!targetPage.anchors.has(targetAnchor)) {
              errors.push({
                file: relative(landingRoot, file),
                line: lineIdx + 1,
                message: `Broken anchor #${targetAnchor} on target page ${cleanTarget}`,
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
  const errs = runLinkCheck();
  if (errs.length > 0) {
    console.error(`Link check failed: ${errs.length} broken links/anchors found.`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All internal links and anchors resolved.');
  }
}
