import { defineConfig } from 'tsup';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

async function copyCSSAssets() {
  await mkdir(resolve('dist/esm/theme'), { recursive: true });
  await mkdir(resolve('dist/cjs/theme'), { recursive: true });
  await copyFile('src/theme/base.css', 'dist/esm/theme/base.css');
  await copyFile('src/theme/base.css', 'dist/cjs/theme/base.css');
  console.log('✔ Copied theme/base.css to dist/esm and dist/cjs');
}

/**
 * Post-process: embed the extracted index.css into index.js so
 * component styles are auto-injected at runtime when the JS is imported.
 * Consumers no longer need a separate `import '…/index.css'` statement.
 */
async function injectCSSIntoJS(dir: string) {
  const cssPath = resolve(dir, 'index.css');
  const jsPath = resolve(dir, 'index.js');

  if (!existsSync(cssPath) || !existsSync(jsPath)) return;

  const css = await readFile(cssPath, 'utf8');
  const js = await readFile(jsPath, 'utf8');

  const injection =
    `"use client";\n` +
    `/* auto-injected component styles */\n` +
    `(function(){if(typeof document!=='undefined'&&!document.getElementById('lxs-ui-styles')){` +
    `var s=document.createElement('style');s.id='lxs-ui-styles';` +
    `s.textContent=${JSON.stringify(css)};document.head.appendChild(s)}})();\n`;

  await writeFile(jsPath, injection + js, 'utf8');
  console.log(`✔ Injected CSS into ${dir}/index.js`);
}

export default defineConfig([
  // ── ESM build ────────────────────────────────────────────────────────────
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist/esm',
    outExtension: () => ({ js: '.js' }),
    splitting: true,
    treeshake: true,
    sourcemap: false,
    external: ['react', 'react-dom'],
    async onSuccess() {
      // wipe stale root-level dist artefacts from previous builds
      await rm(resolve('dist/index.js'), { force: true });
      await rm(resolve('dist/index.mjs'), { force: true });
      await rm(resolve('dist/index.css'), { force: true });
      await rm(resolve('dist/index.d.ts'), { force: true });
      await rm(resolve('dist/index.d.mts'), { force: true });
      await rm(resolve('dist/theme'), { recursive: true, force: true });
      await copyCSSAssets();
      await injectCSSIntoJS('dist/esm');
    },
  },
  // ── CJS build ────────────────────────────────────────────────────────────
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs'],
    outDir: 'dist/cjs',
    outExtension: () => ({ js: '.js' }),
    splitting: false,
    treeshake: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    async onSuccess() {
      await injectCSSIntoJS('dist/cjs');
    },
  },
  // ── Types ─────────────────────────────────────────────────────────────────
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist/types',
    dts: { only: true },
    external: ['react', 'react-dom'],
  },
]);
