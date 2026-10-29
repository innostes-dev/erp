import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const devDocsRoot = join(landingRoot, 'content', 'dev-docs');

function getMdxFiles(dir) {
  let results = [];
  try {
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      if (statSync(full).isDirectory()) {
        results = results.concat(getMdxFiles(full));
      } else if (full.endsWith('.mdx')) {
        results.push(full);
      }
    }
  } catch {
    // Directory might not exist yet
  }
  return results;
}

export async function runDiagramCheck() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  if (!globalThis.window) globalThis.window = dom.window;
  if (!globalThis.document) globalThis.document = dom.window.document;

  const mermaidModule = await import('../../node_modules/mermaid/dist/mermaid.core.mjs');
  const mermaid = mermaidModule.default;
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

  const files = getMdxFiles(devDocsRoot);
  const errors = [];
  let diagramCount = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const relFile = relative(landingRoot, file);
    const lines = content.split('\n');

    // 1. Check fenced mermaid code blocks: ```mermaid ... ```
    let inMermaid = false;
    let mermaidLines = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inMermaid && line.trim().startsWith('```mermaid')) {
        inMermaid = true;
        mermaidLines = [];
        startLine = i + 1;
        continue;
      }
      if (inMermaid && line.trim() === '```') {
        inMermaid = false;
        const chart = mermaidLines.join('\n').trim();
        if (chart) {
          diagramCount++;
          try {
            await mermaid.parse(chart);
          } catch (err) {
            errors.push({
              file: relFile,
              line: startLine,
              message: `Mermaid fenced block syntax error: ${err.message?.split('\n')[0] || err}`,
            });
          }
        }
        continue;
      }
      if (inMermaid) {
        mermaidLines.push(line);
      }
    }

    // 2. Check real <Diagram> component content (excluding examples inside fenced code blocks)
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
    const diagramRegex = /<Diagram\b[^>]*>([\s\S]*?)<\/Diagram>/g;
    let match;
    while ((match = diagramRegex.exec(contentWithoutCodeBlocks)) !== null) {
      let chart = match[1].trim();
      // Clean possible MDX template literal wrapping: {` ... `}
      if (chart.startsWith('{`') && chart.endsWith('`}')) {
        chart = chart.slice(2, -2).trim();
      }
      if (!chart) continue;
      diagramCount++;
      // Calculate line number in original content
      const lineNum = content.slice(0, match.index).split('\n').length;
      try {
        await mermaid.parse(chart);
      } catch (err) {
        errors.push({
          file: relFile,
          line: lineNum,
          message: `<Diagram> component syntax error: ${err.message?.split('\n')[0] || err}`,
        });
      }
    }
  }

  return {
    errors,
    diagramCount,
    passed: errors.length === 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runDiagramCheck();
  console.log(`Checked ${result.diagramCount} Mermaid diagram(s).`);
  if (result.errors.length > 0) {
    console.error(`Found ${result.errors.length} diagram syntax error(s):`);
    for (const err of result.errors) {
      console.error(`  ${err.file}:${err.line} - ${err.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All diagrams parsed successfully.');
    process.exit(0);
  }
}
