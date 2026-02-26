import { type Meta, type StoryObj } from '@storybook/angular';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ApertureViewComponent } from './aperture-view.component';

const meta: Meta<ApertureViewComponent> = {
  title: 'Sidebar/Aperture View',
  component: ApertureViewComponent,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ApertureViewComponent>;

const ura2x2 = [
  { name: 'T0', pos: new Vector3(-0.0043, -0.0043), enabled: true, selected: false },
  { name: 'T1', pos: new Vector3(0.0043, -0.0043), enabled: true, selected: false },
  { name: 'T2', pos: new Vector3(-0.0043, 0.0043), enabled: true, selected: false },
  { name: 'T3', pos: new Vector3(0.0043, 0.0043), enabled: true, selected: false },
];

export const PointSources: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: 'Point',
    transducerDiameter: 0.003,
  },
};

export const PistonTransducers: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: 'Piston',
    transducerDiameter: 0.003,
  },
};

export const WithArrayDiameter: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: 'Point',
    transducerDiameter: 0.003,
    arrayDiameter: 0.02,
  },
};
