import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default ts.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'vendor/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ['src/games/*/engine/**/*.ts', 'src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-dom/*',
                'three',
                'three/*',
                '@react-three/*',
                '**/scene/**',
                '**/infrastructure/**',
                '**/app/**',
                '**/burr/**',
              ],
              message:
                'Domain code must stay independent of rendering, infrastructure, and other games.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/cube/scene/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['**/games/burr/**', '**/burr/**'] }] },
  },
  { files: ['**/*.js'], languageOptions: { globals: globals.node } },
);
