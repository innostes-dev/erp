import {
  type Tree,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  updateJson,
} from '@nx/devkit';
import * as path from 'path';

interface ModuleGeneratorSchema {
  name: string;
}

export default async function moduleGenerator(tree: Tree, schema: ModuleGeneratorSchema) {
  const n = names(schema.name);
  const modulePath = `libs/modules/${n.fileName}`;

  const layers = ['feature', 'ui', 'data-access', 'utils'] as const;
  const typeMap = {
    feature: 'type:feature',
    ui: 'type:ui',
    'data-access': 'type:data-access',
    utils: 'type:util',
  } as const;
  const platformMap = {
    feature: 'platform:web',
    ui: 'platform:web',
    'data-access': 'platform:web',
    utils: 'platform:isomorphic',
  } as const;

  for (const layer of layers) {
    const layerPath = `${modulePath}/${layer}`;

    // project.json
    tree.write(
      `${layerPath}/project.json`,
      JSON.stringify(
        {
          name: `${n.fileName}-${layer}`,
          $schema: `${offsetFromRoot(layerPath)}node_modules/nx/schemas/project.json`,
          sourceRoot: `${layerPath}/src`,
          projectType: 'library',
          tags: [typeMap[layer], `scope:${n.fileName}`, platformMap[layer]],
        },
        null,
        2,
      ) + '\n',
    );

    // tsconfig.json
    tree.write(
      `${layerPath}/tsconfig.json`,
      JSON.stringify(
        {
          extends: `${offsetFromRoot(layerPath)}tsconfig.base.json`,
          compilerOptions: { jsx: 'react-jsx', strict: true },
          files: [],
          include: [],
          references: [{ path: './tsconfig.lib.json' }],
        },
        null,
        2,
      ) + '\n',
    );

    // tsconfig.lib.json
    tree.write(
      `${layerPath}/tsconfig.lib.json`,
      JSON.stringify(
        {
          extends: './tsconfig.json',
          compilerOptions: { outDir: `${offsetFromRoot(layerPath)}dist/out-tsc`, declaration: true },
          include: ['src/**/*.ts', 'src/**/*.tsx'],
        },
        null,
        2,
      ) + '\n',
    );

    // Empty barrel
    tree.write(`${layerPath}/src/index.ts`, `// ${n.className} ${layer} public API\n`);
  }

  // Add tsconfig path aliases
  updateJson(tree, 'tsconfig.base.json', (tsconfig) => {
    const p = tsconfig.compilerOptions.paths ?? {};
    for (const layer of layers) {
      p[`@mono/modules/${n.fileName}/${layer}`] = [
        `libs/modules/${n.fileName}/${layer}/src/index.ts`,
      ];
    }
    tsconfig.compilerOptions.paths = p;
    return tsconfig;
  });

  // Stub route group in shell
  const routeGroupPath = `apps/shell/src/app/(${n.fileName})/${n.fileName}`;
  if (!tree.exists(`${routeGroupPath}/page.tsx`)) {
    tree.write(
      `${routeGroupPath}/page.tsx`,
      `import type { Metadata } from 'next';\n\nexport const metadata: Metadata = { title: '${n.className}' };\n\nexport default function ${n.className}Page() {\n  return <div>${n.className} module</div>;\n}\n`,
    );
  }

  await formatFiles(tree);
}
