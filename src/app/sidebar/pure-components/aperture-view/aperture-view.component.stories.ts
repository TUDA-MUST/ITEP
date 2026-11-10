import { type Meta, type StoryObj } from '@storybook/angular';
import { partitionAperture } from 'src/app/core/voronoi';
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

export const VoronoiGrid: Story = {
  args: {
    ...PointSources.args,
    arrayDiameter: null,
    cells: partitionAperture(
      ura2x2.map((t) => t.pos),
      null,
    ).cells,
  },
};

const irregular = [...ura2x2, { ...ura2x2[0], name: 'T4', pos: { x: 0.003, y: -0.001, z: 0 } }];

export const VoronoiCircularAperture: Story = {
  args: {
    ...PointSources.args,
    transducers: irregular,
    cells: partitionAperture(
      irregular.map((t) => t.pos),
      0.02,
    ).cells,
  },
};
