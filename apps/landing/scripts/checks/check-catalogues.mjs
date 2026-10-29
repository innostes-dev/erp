import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const apiServerRoot = join(landingRoot, '..', 'api-server');
const errorsPyPath = join(landingRoot, '..', '..', 'kernel', 'backend', 'kernel', 'core', 'services', 'errors.py');
const errorCodesMdxPath = join(landingRoot, 'content', 'api-docs', 'policies', 'error-codes.mdx');
const changelogMdPath = join(apiServerRoot, 'CHANGELOG.md');
const openapiJsonPath = join(apiServerRoot, 'openapi.json');

export function runCatalogueCheck() {
  const errors = [];

  // 1. Verify Error Codes Catalogue sync
  if (!existsSync(errorsPyPath)) {
    errors.push({
      file: 'kernel/backend/kernel/core/services/errors.py',
      line: 1,
      message: 'errors.py does not exist',
    });
    return errors;
  }
  if (!existsSync(errorCodesMdxPath)) {
    errors.push({
      file: 'apps/landing/content/api-docs/policies/error-codes.mdx',
      line: 1,
      message: 'error-codes.mdx does not exist',
    });
    return errors;
  }

  const errorsPyContent = readFileSync(errorsPyPath, 'utf8');
  const errorCodesMdxContent = readFileSync(errorCodesMdxPath, 'utf8');

  // Extract all codes from class ErrorCode
  const errorCodeBlockMatch = errorsPyContent.match(/class ErrorCode:\s*"""[\s\S]*?"""([\s\S]*?)(?=\nclass |\Z)/);
  if (errorCodeBlockMatch) {
    const lines = errorCodeBlockMatch[1].split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^[A-Z0-9_]+\s*=\s*["']([^"']+)["']/);
      if (match) {
        const codeValue = match[1];
        if (!errorCodesMdxContent.includes(`\`${codeValue}\``)) {
          errors.push({
            file: 'apps/landing/content/api-docs/policies/error-codes.mdx',
            line: 1,
            message: `Machine error code "${codeValue}" from ErrorCode is missing from error-codes.mdx catalogue.`,
          });
        }
      }
    }
  }

  // 2. Verify Changelog sync against openapi.json version
  if (!existsSync(changelogMdPath)) {
    errors.push({
      file: 'apps/api-server/CHANGELOG.md',
      line: 1,
      message: 'apps/api-server/CHANGELOG.md is missing',
    });
  } else if (existsSync(openapiJsonPath)) {
    const spec = JSON.parse(readFileSync(openapiJsonPath, 'utf8'));
    const version = spec.info?.version || '0.1.0';
    const changelogContent = readFileSync(changelogMdPath, 'utf8');

    if (!changelogContent.includes(`## [${version}]`)) {
      errors.push({
        file: 'apps/api-server/CHANGELOG.md',
        line: 1,
        message: `API specification version [${version}] lacks a corresponding section in CHANGELOG.md.`,
      });
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runCatalogueCheck();
  if (errs.length > 0) {
    console.error(`Catalogue check failed with ${errs.length} issues:`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All ErrorCode constants and API changelog versions are verified and in sync.');
  }
}
