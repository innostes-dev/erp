import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/build', '**/.next', '**/node_modules', '**/coverage'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ── Layer rules ──────────────────────────────────────────────
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
                'type:types',
                'type:kernel',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:kernel',
              onlyDependOnLibsWithTags: ['type:util', 'type:types'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:util',
                'type:types',
                'type:kernel',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:types'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:util', 'type:types', 'type:kernel'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:types'],
            },
            {
              sourceTag: 'type:types',
              onlyDependOnLibsWithTags: [],
            },
            // ── Platform rules ───────────────────────────────────────────
            {
              sourceTag: 'platform:web',
              notDependOnLibsWithTags: ['platform:server'],
            },
            {
              sourceTag: 'platform:server',
              notDependOnLibsWithTags: ['platform:web'],
            },
            // ── Scope isolation (no horizontal domain coupling) ──────────
            {
              sourceTag: 'scope:checkout',
              notDependOnLibsWithTags: [
                'scope:account', 'scope:catalog', 'scope:orders',
                'scope:payments', 'scope:admin', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:account',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:catalog', 'scope:orders',
                'scope:payments', 'scope:admin', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:catalog',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:account', 'scope:orders',
                'scope:payments', 'scope:admin', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:orders',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:account', 'scope:catalog',
                'scope:payments', 'scope:admin', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:payments',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:account', 'scope:catalog',
                'scope:orders', 'scope:admin', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:admin',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:account', 'scope:catalog',
                'scope:orders', 'scope:payments', 'scope:notifications',
              ],
            },
            {
              sourceTag: 'scope:notifications',
              notDependOnLibsWithTags: [
                'scope:checkout', 'scope:account', 'scope:catalog',
                'scope:orders', 'scope:payments', 'scope:admin',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
