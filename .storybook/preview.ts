import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    viewport: {
      options: {
        sidebar: {
          name: 'Sidebar',
          styles: { width: '300px', height: '450px' },
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
    viewport: { value: 'sidebar' },
  },
};

export default preview;
