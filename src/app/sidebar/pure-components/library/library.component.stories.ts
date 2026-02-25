import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { LibraryComponent } from './library.component';
import { presets } from 'src/app/presets';

const meta: Meta<LibraryComponent> = {
  title: 'Sidebar/Library',
  component: LibraryComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'sidebar',
    },
  },
};

export default meta;
type Story = StoryObj<LibraryComponent>;

export const WithPresets: Story = {
  args: {
    presets,
  },
};

export const Empty: Story = {
  args: {
    presets: [],
  },
};
