import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..');
const contentDocs = join(landingRoot, 'content', 'docs');
const publicDir = join(landingRoot, 'public');

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const res = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      res[key] = val;
    }
  }
  return res;
}

function getMdxFiles(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getMdxFiles(full));
    } else if (item.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

export function generateLlmsFiles() {
  const files = getMdxFiles(contentDocs);
  const baseUrl = 'https://innostes.com/ui/docs';

  const sections = {
    overview: [],
    components: [],
    widgets: [],
    charts: [],
    examples: [],
    resources: [],
  };

  let fullContent = `# innostes UI - Complete Documentation\n\nGenerated for AI assistants and offline reference.\n\n---\n\n`;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const fm = extractFrontmatter(content);
    const rel = file.slice(contentDocs.length + 1).replace(/\.mdx$/, '');
    const url = rel === 'index' ? baseUrl : `${baseUrl}/${rel}`;
    const title = fm.title || rel.split('/').pop();
    const summary = fm.summary || fm.description || 'Enterprise UI component documentation.';
    const status = fm.status ? ` [${fm.status}]` : '';

    const entry = `- [${title}](${url})${status}: ${summary}`;

    if (rel.startsWith('components/')) {
      sections.components.push(entry);
    } else if (rel.startsWith('widgets/')) {
      sections.widgets.push(entry);
    } else if (rel.startsWith('charts/')) {
      sections.charts.push(entry);
    } else if (rel.startsWith('examples/')) {
      sections.examples.push(entry);
    } else if (rel.startsWith('resources/') || rel === 'conventions') {
      sections.resources.push(entry);
    } else {
      sections.overview.push(entry);
    }

    // Append to full document
    const body = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    fullContent += `## ${title} (${url})\n\n${summary}\n\n${body}\n\n---\n\n`;
  }

  const llmsTxt = `# innostes UI

> A production-grade design system and React component library engineered for enterprise ERP, HRMS, and CRM platforms. Accessible, WCAG 2.2 AA compliant, and localized.

## Core Documentation
${sections.overview.join('\n')}

## Components
${sections.components.join('\n')}

## Widgets
${sections.widgets.join('\n')}

## Charts
${sections.charts.join('\n')}

## Patterns and Examples
${sections.examples.join('\n')}

## Resources and Governance
${sections.resources.join('\n')}

## Full Documentation
- [Full LLM Reference](https://innostes.com/llms-full.txt): Complete consolidated documentation and API reference in one document.
`;

  writeFileSync(join(publicDir, 'llms.txt'), llmsTxt.trim() + '\n', 'utf8');
  writeFileSync(join(publicDir, 'llms-full.txt'), fullContent.trim() + '\n', 'utf8');
  console.log('✓ Generated public/llms.txt and public/llms-full.txt successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateLlmsFiles();
}
