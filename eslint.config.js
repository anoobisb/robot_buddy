import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**', '*.config.*', 'tests/e2e/**'],
    rules: { 'no-console': 'off' },
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
);
