import { ArrayConfigComponent } from "./array-config.component";
import * as componentMetadata from "./array-config.component.metadata";

import { type StoryFn, type Meta, moduleMetadata } from "@storybook/angular";

export default {
  title: "Array config",
  component: ArrayConfigComponent,
  argTypes: {},
  decorators: [ moduleMetadata(componentMetadata.moduleMetaData) ],
  parameters: {
    viewport: {
      defaultViewport: "sidebarPanel",
    },
    backgrounds: {
      default: 'dark',
    },
    layout: 'centered',
  },
} as Meta<ArrayConfigComponent>;

const Template: StoryFn<ArrayConfigComponent> = (
  args,
) => ({
  props: args,
});

export const Default: StoryFn<ArrayConfigComponent> = Template.bind({});
Default.args = {};

