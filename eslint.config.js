import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly' },
    },
    rules: { 'no-console': 'off', 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { ignores: ['node_modules/', 'coverage/'] },
];
