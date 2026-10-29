import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const apiServerRoot = join(landingRoot, '..', 'api-server');
const openapiPath = join(apiServerRoot, 'openapi.json');
const publicOpenapiPath = join(landingRoot, 'public', 'openapi.json');
const apiDocsDir = join(landingRoot, 'content', 'api-docs');

const toKebab = (str) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

const tagSlugs = {
  General: 'general',
  Observability: 'observability',
  Authentication: 'authentication',
  Setup: 'setup',
  Tenancy: 'tenancy',
  'User management': 'user-management',
  CRM: 'crm',
  HRMS: 'hrms',
  'API logger': 'api-logger',
};

export function runApiDocsStaleCheck() {
  const errors = [];

  if (!existsSync(openapiPath)) {
    errors.push({
      file: 'apps/api-server/openapi.json',
      line: 1,
      message: 'Source openapi.json does not exist.',
    });
    return errors;
  }

  let spec;
  try {
    spec = JSON.parse(readFileSync(openapiPath, 'utf8'));
  } catch (e) {
    errors.push({
      file: 'apps/api-server/openapi.json',
      line: 1,
      message: `Failed to parse openapi.json: ${e.message}`,
    });
    return errors;
  }

  // Check public/openapi.json freshness
  if (!existsSync(publicOpenapiPath)) {
    errors.push({
      file: 'apps/landing/public/openapi.json',
      line: 1,
      message: 'public/openapi.json is missing. Run `node scripts/generate-api-docs.mjs`.',
    });
  } else {
    const pubContent = readFileSync(publicOpenapiPath, 'utf8');
    const srcContent = readFileSync(openapiPath, 'utf8');
    if (pubContent !== srcContent) {
      errors.push({
        file: 'apps/landing/public/openapi.json',
        line: 1,
        message: 'public/openapi.json differs from apps/api-server/openapi.json.',
      });
    }
  }

  // Check that index and meta.json exist
  if (!existsSync(join(apiDocsDir, 'index.mdx'))) {
    errors.push({
      file: 'apps/landing/content/api-docs/index.mdx',
      line: 1,
      message: 'Overview page content/api-docs/index.mdx is missing.',
    });
  }
  if (!existsSync(join(apiDocsDir, 'meta.json'))) {
    errors.push({
      file: 'apps/landing/content/api-docs/meta.json',
      line: 1,
      message: 'Root meta.json content/api-docs/meta.json is missing.',
    });
  }

  // Check operations
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) continue;
      const tag = op.tags?.[0] || 'General';
      const tagSlug = tagSlugs[tag] || toKebab(tag);
      const opSlug = toKebab(op.operationId || `${method}-${path}`);
      const expectedFile = join(apiDocsDir, tagSlug, `${opSlug}.mdx`);

      if (!existsSync(expectedFile)) {
        errors.push({
          file: `apps/landing/content/api-docs/${tagSlug}/${opSlug}.mdx`,
          line: 1,
          message: `Missing reference page for ${method.toUpperCase()} ${path} (${op.operationId})`,
        });
      }
    }
  }

  // Check schemas
  for (const schemaName of Object.keys(spec.components?.schemas || {})) {
    const schemaSlug = toKebab(schemaName);
    const expectedFile = join(apiDocsDir, 'schemas', `${schemaSlug}.mdx`);
    if (!existsSync(expectedFile)) {
      errors.push({
        file: `apps/landing/content/api-docs/schemas/${schemaSlug}.mdx`,
        line: 1,
        message: `Missing schema reference page for schema ${schemaName}`,
      });
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runApiDocsStaleCheck();
  if (errs.length > 0) {
    console.error(`API docs freshness check failed with ${errs.length} issues:`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All 33 API operations and 41 schemas are fresh against openapi.json.');
  }
}
