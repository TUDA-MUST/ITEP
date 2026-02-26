import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ArrayConfigComponent } from './array-config.component';
import * as componentMetadata from './array-config.component.metadata';

const meta: Meta<ArrayConfigComponent> = {
  title: 'Sidebar/Array Config',
  component: ArrayConfigComponent,
  decorators: [moduleMetadata(componentMetadata.moduleMetaData)],
  parameters: {
    viewport: {
      defaultViewport: 'sidebar',
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ArrayConfigComponent>;

export const Default: Story = {};
