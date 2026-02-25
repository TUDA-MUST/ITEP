import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { KPIComponent } from './kpi.component';

const meta: Meta<KPIComponent> = {
  title: 'Sidebar/KPI',
  component: KPIComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
  ],
  argTypes: {
    hoveredKpi: { action: 'hoveredKpi' },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<KPIComponent>;

export const WithKPIs: Story = {
  args: {
    kpis: {
      numElements: 64,
      az: {
        leftHPBWCrossing: -3.2,
        rightHPBWCrossing: 3.2,
        leftZeroCrossing: -6.5,
        rightZeroCrossing: 6.5,
        hpbw: 6.4,
        fnbw: 13.0,
        sll: 0.21,
        slr: -13.5,
        maxl: 1.0,
      },
      el: {
        leftHPBWCrossing: -3.2,
        rightHPBWCrossing: 3.2,
        leftZeroCrossing: -6.5,
        rightZeroCrossing: 6.5,
        hpbw: 6.4,
        fnbw: 13.0,
        sll: 0.21,
        slr: -13.5,
        maxl: 1.0,
      },
    },
  },
};

export const Empty: Story = {
  args: {
    kpis: undefined,
  },
};
