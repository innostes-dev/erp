// Generates dist/api.json: the public props of every component, read from the TSDoc comments
// in src. The docs site renders its API tables from this file, so the docs can't drift from
// the code.
//
// Only props declared in this package are listed. Props inherited from Base UI or the DOM
// are left out; each component's docs link to the Base UI reference for those.
//
// Usage: node scripts/generate-api-docs.mjs  (runs automatically at the end of `nx build ui`)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import docgen from 'react-docgen-typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['src/components/**/*.tsx', 'src/widgets/**/*.tsx', 'src/charts/**/*.tsx', 'src/editor/**/*.tsx']
  .flatMap((pattern) => globSync(pattern, { cwd: root }))
  .filter((file) => !file.endsWith('.test.tsx'))
  .map((file) => join(root, file));

const parser = docgen.withCustomConfig(join(root, 'tsconfig.lib.json'), {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => {
    const declarations = prop.declarations ?? [];
    if (declarations.length === 0) return true;
    // Keep props declared in our own source; drop node_modules (Base UI, React DOM types).
    return declarations.some((d) => !d.fileName.includes('node_modules'));
  },
});

const components = {};
for (const doc of parser.parse(files)) {
  // Skip internal helpers, and names that aren't exported by us (e.g. Base UI's own names
  // for components we re-export under a different name).
  if (!/^[A-Z]/.test(doc.displayName)) continue;
  const source = readFileSync(doc.filePath, 'utf8');
  let name = doc.displayName;
  // Generic components are written as `XImpl` and exported as `X = forwardRef(XImpl)`.
  // String.raw keeps the backslashes, so \w and \( reach the RegExp intact.
  const alias = new RegExp(String.raw`export const (\w+) = forwardRef\(${name}\)`).exec(source);
  if (alias) name = alias[1];
  else if (!new RegExp(String.raw`export (function|const) ${name}(?![\w$])`).test(source)) continue;
  const file = relative(root, doc.filePath).split(sep).join('/');
  components[name] = {
    description: doc.description,
    file,
    category: ['widgets', 'charts', 'editor'].includes(file.split('/')[1]) ? file.split('/')[1] : file.split('/')[2],
    props: Object.fromEntries(
      Object.entries(doc.props)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, prop]) => [
          name,
          {
            type: prop.type?.raw ?? prop.type?.name ?? 'unknown',
            required: prop.required,
            default:
              prop.defaultValue?.value ??
              extractDefaultTag(prop.description) ??
              null,
            description: stripDefaultTag(prop.description),
          },
        ]),
    ),
  };
}

function extractDefaultTag(text) {
  return text?.match(/@default\s+(.+)/)?.[1]?.trim() ?? null;
}

function stripDefaultTag(text) {
  return (text ?? '').replace(/@default\s+.+/g, '').trim();
}

const out = join(root, 'dist', 'api.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({ generatedFrom: '@innostes/ui', components }, null, 2) + '\n',
);
console.log(`api.json: ${Object.keys(components).length} components`);
