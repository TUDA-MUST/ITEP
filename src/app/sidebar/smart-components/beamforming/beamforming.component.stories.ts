import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { BeamformingComponent } from './beamforming.component';
import * as componentMetadata from './beamforming.component.metadata';

const meta: Meta<BeamformingComponent> = {
  title: 'Sidebar/Beamforming',
  component: BeamformingComponent,
  decorators: [moduleMetadata(componentMetadata.moduleMetaData)],
  parameters: {
    viewport: {
      defaultViewport: 'sidebar',
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<BeamformingComponent>;

export const Default: Story = {};
