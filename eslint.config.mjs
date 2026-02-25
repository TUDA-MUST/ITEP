// @ts-check
import angularPlugin from '@angular-eslint/eslint-plugin';
import angularTemplatePlugin from '@angular-eslint/eslint-plugin-template';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import templateParser from '@angular-eslint/template-parser';
import storybookPlugin from 'eslint-plugin-storybook';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['projects/**/*'],
  },

  // TypeScript source files
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint': angularPlugin,
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.spec.json'],
      },
    },
    processor: angularTemplatePlugin.processors['extract-inline-html'],
    rules: {
      // Angular recommended rules
      ...angularPlugin.configs.recommended.rules,

      // Angular component/directive selectors
      '@angular-eslint/component-selector': [
        'error',
        { prefix: 'app', style: 'kebab-case', type: 'element' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { prefix: 'app', style: 'camelCase', type: 'attribute' },
      ],

      // Modern Angular: prefer signals and inject() API
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/no-pipe-impure': 'warn',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',

      // TypeScript recommended rules
      ...typescriptEslintPlugin.configs.recommended.rules,

      // TypeScript best practices
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Arrow-function shorthand: prefer concise bodies and arrow callbacks
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',

      // Disable ESLint formatting rules that conflict with Prettier
      ...prettierConfig.rules,

      // Prettier formatting as ESLint errors
      'prettier/prettier': 'error',
    },
  },

  // TypeScript declaration files: relax rules not applicable to ambient declarations
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Angular HTML templates
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplatePlugin,
    },
    languageOptions: {
      parser: templateParser,
    },
    rules: {
      // Angular template recommended rules
      ...angularTemplatePlugin.configs.recommended.rules,

      // Template best practices
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/use-track-by-function': 'warn',
      '@angular-eslint/template/no-any': 'warn',
    },
  },

  // Storybook story files
  ...storybookPlugin.configs['flat/recommended'],
];
