import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

function getTsFiles(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  try {
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      if (statSync(full).isDirectory()) {
        if (item === 'node_modules' || item === 'dist' || item === '.next') continue;
        results = results.concat(getTsFiles(full));
      } else if (/\.(ts|tsx)$/.test(full) && !full.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  } catch {
    // Ignore unreadable dirs
  }
  return results;
}

export function runTsBoundaryCheck() {
  const errors = [];
  let filesChecked = 0;

  // Rule 1: packages/ui must not import from kernel, modules, plugins, or apps
  const uiFiles = getTsFiles(join(repoRoot, 'packages', 'ui', 'src'));
  for (const file of uiFiles) {
    filesChecked++;
    const relFile = relative(repoRoot, file);
    const content = readFileSync(file, 'utf8');
    const importMatches = content.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const imp = match[1];
      if (
        imp.startsWith('@innostes/kernel') ||
        imp.startsWith('@innostes/web-app') ||
        imp.startsWith('@innostes/hrms') ||
        imp.startsWith('@innostes/crm') ||
        imp.startsWith('@innostes/api-logger') ||
        imp.includes('../../kernel') ||
        imp.includes('../../modules') ||
        imp.includes('../../plugins') ||
        imp.includes('../../apps')
      ) {
        errors.push({
          file: relFile,
          message: `Package @innostes/ui must not depend on higher layers: imported "${imp}" (Rule 3, F1)`,
        });
      }
    }
  }

  // Rule 2: kernel/frontend must not import from modules, plugins, or apps
  const kernelFiles = getTsFiles(join(repoRoot, 'kernel', 'frontend', 'src'));
  for (const file of kernelFiles) {
    filesChecked++;
    const relFile = relative(repoRoot, file);
    const content = readFileSync(file, 'utf8');
    const importMatches = content.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const imp = match[1];
      if (
        imp.startsWith('@innostes/web-app') ||
        imp.startsWith('@innostes/hrms') ||
        imp.startsWith('@innostes/crm') ||
        imp.startsWith('@innostes/api-logger') ||
        imp.includes('../../modules') ||
        imp.includes('../../plugins') ||
        imp.includes('../../apps')
      ) {
        errors.push({
          file: relFile,
          message: `Kernel frontend must not depend on modules, plugins, or apps: imported "${imp}" (Rule 3, F1)`,
        });
      }
    }
  }

  // Rule 3: Business modules frontend must not import each other or plugins
  const modulesDir = join(repoRoot, 'modules');
  if (existsSync(modulesDir)) {
    for (const mod of readdirSync(modulesDir)) {
      const modSrc = join(modulesDir, mod, 'frontend', 'src');
      const modFiles = getTsFiles(modSrc);
      for (const file of modFiles) {
        filesChecked++;
        const relFile = relative(repoRoot, file);
        const content = readFileSync(file, 'utf8');
        const importMatches = content.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g);
        for (const match of importMatches) {
          const imp = match[1];
          if (
            imp.startsWith('@innostes/web-app') ||
            (imp.startsWith('@innostes/') && !['@innostes/ui', '@innostes/kernel', `@innostes/${mod}`].includes(imp))
          ) {
            errors.push({
              file: relFile,
              message: `Business module "${mod}" frontend must not import external module/plugin: "${imp}" (Rule 4, F1)`,
            });
          }
        }
      }
    }
  }

  return {
    filesChecked,
    errors,
    passed: errors.length === 0,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runTsBoundaryCheck();
  console.log(`Checked TypeScript module boundaries across ${result.filesChecked} files.`);
  if (!result.passed) {
    console.error(`Found ${result.errors.length} TypeScript module boundary violation(s):`);
    for (const err of result.errors) {
      console.error(`  ${err.file}: ${err.message}`);
    }
    process.exit(1);
  } else {
    console.log('✓ All TypeScript module boundaries respected.');
    process.exit(0);
  }
}
