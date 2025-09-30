import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const tsRecommendations = tseslint.configs['recommended-type-checked'].rules;
const tsStylistic = tseslint.configs['stylistic-type-checked'].rules;

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tsRecommendations,
      ...tsStylistic,
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  }
];
