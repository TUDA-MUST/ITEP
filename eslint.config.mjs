// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier/flat';
import storybookPlugin from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['projects/**/*'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.spec.json'],
      },
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { prefix: 'app', style: 'kebab-case', type: 'element' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { prefix: 'app', style: 'camelCase', type: 'attribute' },
      ],
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/no-pipe-impure': 'warn',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
    },
  },
  {
    files: ['src/global.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/use-track-by-function': 'warn',
      '@angular-eslint/template/no-any': 'warn',
    },
  },
  ...storybookPlugin.configs['flat/recommended'],
  prettierConfig,
);
