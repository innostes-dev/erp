import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..');
const repoRoot = join(landingRoot, '..', '..');
const uiPackageJsonPath = join(repoRoot, 'packages', 'ui', 'package.json');
const sharedTsPath = join(landingRoot, 'lib', 'shared.ts');

export function runConsistencyCheck() {
  const errors = [];

  if (!existsSync(uiPackageJsonPath)) {
    errors.push({
      file: 'packages/ui/package.json',
      line: 1,
      message: 'packages/ui/package.json not found.',
    });
    return errors;
  }

  const pkg = JSON.parse(readFileSync(uiPackageJsonPath, 'utf8'));
  const sharedContent = readFileSync(sharedTsPath, 'utf8');

  // Check version string
  const versionMatch = /export const uiVersion\s*=\s*['"]([^'"]+)['"]/.exec(sharedContent);
  if (!versionMatch) {
    errors.push({
      file: 'apps/landing/lib/shared.ts',
      line: 1,
      message: 'Could not extract uiVersion from apps/landing/lib/shared.ts.',
    });
  } else if (versionMatch[1] !== pkg.version) {
    errors.push({
      file: 'apps/landing/lib/shared.ts',
      line: 1,
      message: `Version mismatch: shared.ts defines uiVersion as "${versionMatch[1]}", but packages/ui/package.json defines "${pkg.version}".`,
    });
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errs = runConsistencyCheck();
  if (errs.length > 0) {
    console.error(`Consistency check failed: ${errs.length} issues found.`);
    for (const e of errs) {
      console.error(`  ${e.file}:${e.line} - ${e.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ Docs version and package version are consistent.');
  }
}
