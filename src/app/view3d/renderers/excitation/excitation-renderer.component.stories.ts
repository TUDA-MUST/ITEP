import {
  type Meta,
  moduleMetadata,
  componentWrapperDecorator,
  type StoryObj,
} from "@storybook/angular";

import { ExcitationRendererComponent } from "./excitation-renderer.component";
import { BabylonJSViewComponent } from "../../smart-components/babylon-jsview/babylon-jsview.component";
import { Vector3 } from "@babylonjs/core";

export default {
  title: "ExcitationRendererComponent",
  component: BabylonJSViewComponent,
  decorators: [
    moduleMetadata({
      imports: [BabylonJSViewComponent, ExcitationRendererComponent],
    }),
    componentWrapperDecorator(
      (story) => `<app-babylon-jsview>${story}</app-babylon-jsview>`,
    ),
    componentWrapperDecorator(
      (story) => `<div style="height: 600px">${story}</div>`,
    ),
  ],
} as Meta<ExcitationRendererComponent>;

export const Empty: StoryObj<ExcitationRendererComponent> = {
  render: (args) => ({
    props: args,
    template: `<app-excitation-renderer [transducers]=transducers></app-excitation-renderer>`,
  }),
};

export const TwoByTwo: StoryObj<ExcitationRendererComponent> = {
  ...Empty,
  args: {
    transducers: [
      { name: "a", pos: new Vector3(0.1, 0.1), enabled: true, selected: false },
      {
        name: "b",
        pos: new Vector3(-0.1, 0.1),
        enabled: true,
        selected: false,
      },
    ],
  },
};
