import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import configPrettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import {nxEslintPlugin} from '@nx/eslint-plugin';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  configPrettier,
  {
    plugins: {
      '@nx': nxEslintPlugin,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependencyConstraints: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {version: 'detect'},
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.nx/**', 'coverage/**'],
  },
);
