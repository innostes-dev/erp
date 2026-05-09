#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function toPascalCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function injectAfterMarker(source, marker, snippet) {
  if (source.includes(snippet.trim())) {
    return source;
  }
  const index = source.indexOf(marker);
  if (index === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }
  return source.replace(marker, `${snippet}\n${marker}`);
}

async function updateModuleCatalog({ moduleId, moduleName, className, serviceName, methodName }) {
  const catalogPath = path.join(root, 'apps/api-gateway/src/app/module-catalog.ts');
  let content = await fs.readFile(catalogPath, 'utf8');

  const importSnippet = `import { ${serviceName} } from '@innostes/modules/${moduleId}/api-logic';\nimport { ${moduleId}Manifest } from '@innostes/modules/${moduleId}/feature-ui';`;
  content = injectAfterMarker(content, '// @module-imports', importSnippet);

  const manifestSnippet = `  [${moduleId}Manifest.id]: ${moduleId}Manifest,`;
  content = injectAfterMarker(content, '  // @module-manifests', manifestSnippet);

  const serviceSnippet = `  ${serviceName},`;
  content = injectAfterMarker(content, '  // @module-services', serviceSnippet);

  const injectSnippet = `  ${serviceName},`;
  content = injectAfterMarker(content, '  // @module-bridge-injects', injectSnippet);

  const paramsMatch = content.match(/buildBridgeHandlers\s*=\s*\(([^)]*)\)\s*=>/);
  if (!paramsMatch) {
    throw new Error('Unable to parse buildBridgeHandlers signature');
  }
  const params = paramsMatch[1].trim();
  const newParam = `${moduleId}Service: ${serviceName}`;
  if (!params.includes(newParam)) {
    const nextParams = params ? `${params}, ${newParam}` : newParam;
    content = content.replace(paramsMatch[0], `buildBridgeHandlers = (${nextParams}) =>`);
  }

  const handlerSnippet = `  {\n    moduleId: '${moduleId}',\n    isLoaded: true,\n    api: {\n      ${methodName}: (tenantId: string, id: string) => ${moduleId}Service.${methodName}(tenantId, id),\n    },\n  },`;
  content = injectAfterMarker(content, '  // @module-bridge-handlers', handlerSnippet);

  await fs.writeFile(catalogPath, content, 'utf8');
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const moduleId = String(args.id ?? '').trim().toLowerCase();
  if (!moduleId) {
    throw new Error('Missing required --id. Example: npm run generate:module -- --id finance --name Finance');
  }
  if (!/^[a-z][a-z0-9-]*$/.test(moduleId)) {
    throw new Error('Invalid --id. Use lowercase kebab-case, e.g. employee-self-service');
  }

  const moduleName = String(args.name ?? toPascalCase(moduleId));
  const theme = String(args.theme ?? '#2563eb');
  const themeSecondary = String(args['theme-secondary'] ?? '#f97316');
  const themeSurface = String(args['theme-surface'] ?? '#eff6ff');
  const className = toPascalCase(moduleId);
  const serviceName = `${className}PublicService`;
  const methodName = `get${className}Info`;

  const baseModuleDir = path.join(root, 'libs/modules', moduleId);
  if (await fileExists(baseModuleDir)) {
    throw new Error(`Module already exists: libs/modules/${moduleId}`);
  }

  await writeFile(
    path.join(baseModuleDir, 'feature-ui/src/manifest.ts'),
    `export const ${moduleId}Manifest = {
  id: '${moduleId}',
  name: '${moduleName}',
  themeColor: '${theme}',
  theme: {
    primary: '${theme}',
    secondary: '${themeSecondary}',
    surface: '${themeSurface}',
  },
  sidebarGroups: [
    {
      title: '${moduleName}',
      links: [
        { href: '/${moduleId}', label: 'Overview' },
      ],
    },
  ],
};
`
  );

  await writeFile(path.join(baseModuleDir, 'feature-ui/src/index.ts'), `export * from './manifest';\n`);

  await writeFile(
    path.join(baseModuleDir, 'feature-ui/project.json'),
    `{
  "name": "module-${moduleId}-feature-ui",
  "$schema": "../../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/modules/${moduleId}/feature-ui/src",
  "projectType": "library",
  "tags": ["scope:module", "module:${moduleId}", "type:ui"]
}
`
  );

  await writeFile(
    path.join(baseModuleDir, 'data-access/src/schema.ts'),
    `import { pgTable, text } from 'drizzle-orm/pg-core';

export const ${moduleId}Records = pgTable('${moduleId}_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  displayName: text('display_name').notNull(),
});
`
  );

  await writeFile(path.join(baseModuleDir, 'data-access/src/index.ts'), `export * from './schema';\n`);

  await writeFile(
    path.join(baseModuleDir, 'data-access/project.json'),
    `{
  "name": "module-${moduleId}-data-access",
  "$schema": "../../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/modules/${moduleId}/data-access/src",
  "projectType": "library",
  "tags": ["scope:module", "module:${moduleId}", "type:data"]
}
`
  );

  await writeFile(
    path.join(baseModuleDir, 'api-logic/src', `${moduleId}-public.service.ts`),
    `import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PublicApi } from '@innostes/core/bridge';
import { db, withTenant } from '@innostes/core/database';
import { ${moduleId}Records } from '@innostes/modules/${moduleId}/data-access';

@Injectable()
@PublicApi()
export class ${serviceName} {
  async ${methodName}(tenantId: string, id: string) {
    const query = withTenant(${moduleId}Records, tenantId, { where: eq(${moduleId}Records.id, id) });
    const [record] = await db.select().from(${moduleId}Records).where(query.where as never).limit(1);
    return record ?? null;
  }
}
`
  );

  await writeFile(
    path.join(baseModuleDir, 'api-logic/src/index.ts'),
    `export * from './${moduleId}-public.service';\n`
  );

  await writeFile(
    path.join(baseModuleDir, 'api-logic/project.json'),
    `{
  "name": "module-${moduleId}-api-logic",
  "$schema": "../../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/modules/${moduleId}/api-logic/src",
  "projectType": "library",
  "tags": ["scope:module", "module:${moduleId}", "type:api"]
}
`
  );

  await writeFile(
    path.join(root, 'apps/os-shell/src/app/(suite)', moduleId, 'page.tsx'),
    `export default function ${className}Page() {
  return (
    <section>
      <h1>${moduleName}</h1>
      <p>Welcome to ${moduleName}. Replace this scaffold with module-specific pages.</p>
    </section>
  );
}
`
  );

  await updateModuleCatalog({ moduleId, moduleName, className, serviceName, methodName });

  console.log(`Generated module "${moduleId}" in backend + frontend and registered it in module catalog.`);
  console.log(`Next steps:`);
  console.log(`1) Add module-specific Drizzle migration for ${moduleId}_records`);
  console.log(`2) Add module_registry row for tenant/module enablement`);
  console.log(`3) Tune theme tokens in libs/modules/${moduleId}/feature-ui/src/manifest.ts`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
