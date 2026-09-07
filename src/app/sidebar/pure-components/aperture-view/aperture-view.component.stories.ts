import { type Meta, type StoryObj } from '@storybook/angular';
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
  { name: 'T0', pos: { x: -0.0043, y: -0.0043, z: 0 }, enabled: true, selected: false },
  { name: 'T1', pos: { x: 0.0043, y: -0.0043, z: 0 }, enabled: true, selected: false },
  { name: 'T2', pos: { x: -0.0043, y: 0.0043, z: 0 }, enabled: true, selected: false },
  { name: 'T3', pos: { x: 0.0043, y: 0.0043, z: 0 }, enabled: true, selected: false },
];

export const PointSources: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: { type: 'Point' },
    arrayDiameter: 0.02,
  },
};

export const PistonTransducers: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: { type: 'Piston', diameter: 0.003 },
  },
};

export const Rectangular: Story = {
  args: {
    transducers: ura2x2,
    transducerModel: { type: 'Rectangular', width: 0.003, height: 0.002 },
  },
};
