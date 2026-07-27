import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * One flat config for both workspaces. Type-aware linting is deliberately left
 * off: `npm run typecheck` already runs the compiler over both apps, and this
 * keeps `npm run lint` fast enough to use while writing code.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      'apps/api/prisma/migrations/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },

  // Decorator metadata means empty constructors and parameter properties are
  // load-bearing in NestJS.
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  {
    files: ['apps/api/prisma/seed.ts', 'apps/api/test/**/*.ts', 'apps/api/**/*.spec.ts'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
);
