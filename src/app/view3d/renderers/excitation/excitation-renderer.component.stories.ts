import {
  type Meta,
  moduleMetadata,
  componentWrapperDecorator,
  type StoryObj,
} from '@storybook/angular';

import { ExcitationRendererComponent } from './excitation-renderer.component';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BabylonJSViewDirective } from '../../smart-components/babylon-jsview/babylon-jsview.directive';

export default {
  title: 'ExcitationRendererComponent',
  component: BabylonJSViewDirective,
  decorators: [
    moduleMetadata({
      imports: [BabylonJSViewDirective, ExcitationRendererComponent],
    }),
    componentWrapperDecorator((story) => `<app-babylon-jsview>${story}</app-babylon-jsview>`),
    componentWrapperDecorator((story) => `<div style="height: 600px">${story}</div>`),
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
      { name: 'a', pos: new Vector3(0.1, 0.1), enabled: true, selected: false },
      {
        name: 'b',
        pos: new Vector3(-0.1, 0.1),
        enabled: true,
        selected: false,
      },
    ],
  },
};
