import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../src'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs', '@chromatic-com/storybook'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {},
};
export default config;
