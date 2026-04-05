import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'playwright-report',
      'test-results',
      'eslint.config.js',
      'vite.config.ts',
      'postcss.config.js',
      'tailwind.config.ts',
      'src/lib/api/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/incompatible-library': 'warn',
    },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    rules: {
      'react-refresh/only-export-components': [
        'error',
        {
          allowExportNames: [
            'buttonVariants',
            'badgeVariants',
            'useFormField',
          ],
        },
      ],
    },
  },
);
