import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest config for the React compatibility projects (tests/ui-react17, tests/ui-react18).
 *
 * It runs the @innostes/ui test suite against the BUILT package (packages/ui/dist), the way a
 * consumer app installs it, with the React version installed in the compat project. Every
 * import of react, react-dom, Base UI, Recharts and Testing Library resolves to the compat
 * project's own copies, so exactly one React version is loaded.
 */
export function createCompatConfig(projectDir: string, name: string) {
  const ui = path.resolve(projectDir, '../../packages/ui');
  const nm = path.join(projectDir, 'node_modules');
  /** Redirects `pkg` and its subpaths (`pkg/x`) to this project's node_modules. */
  const fromCompat = (pkg: string) => ({
    find: new RegExp(`^${pkg}(/.*)?$`),
    replacement: path.join(nm, pkg) + '$1',
  });

  return defineConfig({
    resolve: {
      alias: [
        { find: /^@innostes\/ui$/, replacement: path.join(ui, 'dist/index.js') },
        { find: /^@innostes\/ui\/charts$/, replacement: path.join(ui, 'dist/charts/index.js') },
        fromCompat('react-dom'),
        fromCompat('react-is'),
        fromCompat('react'),
        fromCompat('@base-ui/react'),
        fromCompat('@testing-library/react'),
        // React 17 apps use Recharts 2.15; React 18+ use Recharts 3.
        fromCompat('recharts'),
      ],
    },
    test: {
      name,
      root: ui,
      include: ['src/components/**/*.test.tsx', 'src/widgets/**/*.test.tsx', 'src/charts/**/*.test.tsx'],
      setupFiles: [path.join(ui, 'src/test/setup.ts'), path.join(projectDir, 'react-version.setup.ts')],
      environment: 'jsdom',
      css: false,
      restoreMocks: true,
      // Generous, because CI runs the React 17/18/19 suites in parallel.
      testTimeout: 15_000,
      // Process these through Vite so the aliases above reach their imports too.
      server: { deps: { inline: [/@base-ui/, /@floating-ui/, /@testing-library\/react/, /recharts/] } },
    },
  });
}
