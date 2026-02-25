import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { CitationComponent } from './citation.component';

const meta: Meta<CitationComponent> = {
  title: 'Sidebar/Citation',
  component: CitationComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<CitationComponent>;

export const Academic: Story = {
  args: {
    citation: {
      kind: 'Academic',
      title:
        'Air-coupled 40-KHZ ultrasonic 2D-phased array based on a 3D-printed waveguide structure',
      authors: 'A. Jäger et. al.',
      year: 2017,
      url: 'https://doi.org/10.1109/ULTSYM.2017.8091892',
      urlTitle: 'ULTSYM.2017.8091892',
    },
    citationIndex: 0,
  },
};

export const Industrial: Story = {
  args: {
    citation: {
      kind: 'Industrial',
      title: 'Example Industrial Array',
      authors: 'Company XYZ',
      year: 2023,
      url: 'https://example.com',
      urlTitle: 'example.com',
    },
    citationIndex: 1,
  },
};

export const Empty: Story = {
  args: {
    citation: null,
    citationIndex: 0,
  },
};
