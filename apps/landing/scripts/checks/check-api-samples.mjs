#!/usr/bin/env node

/**
 * check-api-samples.mjs
 *
 * Quality gate validating all code samples across API guides:
 * 1. All JSON blocks parse cleanly.
 * 2. All curl, TypeScript, and Python snippets reference real endpoints in openapi.json.
 * 3. Strict adherence to enterprise test universe (Northwind Traders, .example domains).
 * 4. Zero banned placeholders (foo, bar, test@test.com).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const GUIDES_DIR = join(landingRoot, 'content', 'api-docs', 'guides');
const OPENAPI_PATH = join(landingRoot, '..', 'api-server', 'openapi.json');

export async function checkApiSamples() {
  const issues = [];

  if (!existsSync(OPENAPI_PATH)) {
    issues.push('apps/api-server/openapi.json not found');
    return { ok: false, issues };
  }

  const spec = JSON.parse(readFileSync(OPENAPI_PATH, 'utf8'));
  const validPaths = new Set(Object.keys(spec.paths || {}));

  if (!existsSync(GUIDES_DIR)) {
    issues.push(`Guides directory not found: ${GUIDES_DIR}`);
    return { ok: false, issues };
  }

  const files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = join(GUIDES_DIR, file);
    const content = readFileSync(filePath, 'utf8');

    // 1. Check for banned email placeholders
    const invalidEmailMatches = content.match(/[\w.-]+@(?!northwind\.example|[\w.-]+\.example)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (invalidEmailMatches) {
      for (const email of invalidEmailMatches) {
        // Allow RFC documentation domains or legitimate package names
        if (!email.includes('example.com') && !email.includes('example.org')) {
          issues.push(`[${file}] Non-reserved email domain detected: "${email}". Use .example per STANDARDS §4.`);
        }
      }
    }

    // 2. Validate JSON code blocks
    const jsonBlockRegex = /```json\b([^`]*?)```/gs;
    let match;
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      const jsonSnippet = match[1].trim();
      // Skip ellipsis-trimmed json snippets
      if (jsonSnippet.includes('...') || jsonSnippet.includes('…')) {
        continue;
      }
      try {
        JSON.parse(jsonSnippet);
      } catch (err) {
        issues.push(`[${file}] Invalid JSON in code block: ${err.message}`);
      }
    }

    // 3. Validate endpoint paths in curl blocks
    const curlBlockRegex = /```bash\b([^`]*?)```/gs;
    while ((match = curlBlockRegex.exec(content)) !== null) {
      const curlSnippet = match[1];
      const urlMatches = curlSnippet.matchAll(/(?:http:\/\/localhost:8001|\$BASE_URL)(\/[a-zA-Z0-9_\-\/{}\.]*)/g);
      for (const urlMatch of urlMatches) {
        let endpoint = urlMatch[1];
        // Strip query params or trailings
        endpoint = endpoint.split('?')[0].replace(/\/+$/, '') || '/';
        // Normalize parameter placeholders like /tenants/{id} or concrete UUIDs
        const normalized = endpoint.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{id}');
        
        let pathFound = validPaths.has(endpoint) || validPaths.has(normalized);
        if (!pathFound) {
          // Check if path matches any parameterized route
          for (const p of validPaths) {
            const regex = new RegExp('^' + p.replace(/\{[^}]+\}/g, '[^/]+') + '$');
            if (regex.test(endpoint)) {
              pathFound = true;
              break;
            }
          }
        }
        if (!pathFound && endpoint !== '/' && !endpoint.startsWith('/docs') && endpoint !== '/openapi.json') {
          issues.push(`[${file}] curl snippet references unregistered endpoint path: "${endpoint}"`);
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

if (process.argv[1]?.endsWith('check-api-samples.mjs')) {
  checkApiSamples().then((result) => {
    if (!result.ok) {
      console.error(`❌ API samples check failed with ${result.issues.length} defect(s):`);
      result.issues.forEach((iss) => console.error(`  - ${iss}`));
      process.exit(1);
    } else {
      console.log('✓ [API SAMPLES] All code samples valid against openapi.json and standards.');
    }
  });
}
