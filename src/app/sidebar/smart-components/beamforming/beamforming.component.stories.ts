import { BeamformingComponent } from "./beamforming.component";
import * as componentMetadata from "./beamforming.component.metadata";

import { StoryFn, Meta, moduleMetadata, applicationConfig } from "@storybook/angular";

export default {
  title: "Beamforming",
  component: BeamformingComponent,
  argTypes: {},
  decorators: [moduleMetadata(componentMetadata.moduleMetaData), 
    applicationConfig({
      providers: []
    })
  ],
  parameters: {
    viewport: {
      defaultViewport: "sidebarPanel",
    },
    backgrounds: {
      default: 'dark',
    },
    layout: 'centered'
  },
} as Meta<BeamformingComponent>;

const Template: StoryFn<BeamformingComponent> = (
  args,
) => ({
  props: args,
});

export const Default: StoryFn<BeamformingComponent> = Template.bind({});
Default.args = {};

