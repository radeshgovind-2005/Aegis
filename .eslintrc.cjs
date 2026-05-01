/**
 * ESLint config for Aegis.
 *
 * Enforces the hexagonal boundary: domain, application, and ports
 * must NEVER import from Cloudflare SDKs or from adapters.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.eslint.json' },
    },
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.wrangler/',
    'coverage/',
    '**/*.d.ts',
    'worker-configuration.d.ts',
    'workers/',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    //
    // The hexagonal boundary.
    // domain/, application/, and ports/ must be Cloudflare-free.
    //
    {
      files: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'src/ports/**/*.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  'cloudflare:*',
                  '@cloudflare/*',
                  './adapters/*',
                  '../adapters/*',
                  '../../adapters/*',
                  '../interfaces/*',
                  '../../interfaces/*',
                ],
                message:
                  'Domain / application / ports layers must not depend on Cloudflare SDKs or on adapters/interfaces. See CLAUDE.md §2 and ADR-0001.',
              },
            ],
          },
        ],
      },
    },
    //
    // Tests may import anything they need.
    //
    {
      files: ['test/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
