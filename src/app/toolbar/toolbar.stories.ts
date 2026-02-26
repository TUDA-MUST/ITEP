import type { Meta, StoryObj } from '@storybook/angular';
import { ToolbarComponent } from './toolbar.component';

const meta: Meta<ToolbarComponent> = {
  title: 'Toolbar',
  component: ToolbarComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ToolbarComponent>;

export const Default: Story = {};
