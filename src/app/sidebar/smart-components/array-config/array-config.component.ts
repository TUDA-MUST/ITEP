import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';

import { type ArrayConfig, type ArrayConfigType, StoreService } from 'src/app/store/store.service';
import { form, FormField, min, max } from '@angular/forms/signals';
import type { Point } from 'src/app/store/export.state';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import type { ArrayGeometry } from 'src/app/core/array';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-array-config',
  templateUrl: './array-config.component.html',
  styleUrl: './array-config.component.scss',
  imports: [
    MatButtonToggleModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatCheckbox,
    MatIcon,
    FormField,
  ],
})
export class ArrayConfigComponent {
  private store = inject(StoreService);

  protected readonly transducerCount = computed(() => this.store.transducers().length);

  private readonly model = signal({
    type: 'ura' as ArrayConfigType,
    elementsX: 0,
    elementsY: 0,
    pitchX: 0,
    pitchY: 0,
    diameter: 0.05,
    elementCount: 5,
    startWithZero: false,
    omitCenter: false,
    elements: 2,
    pitch: 5,
  });

  protected form = form(this.model, (schemaPath) => {
    min(schemaPath.elements, 1);
    max(schemaPath.elements, 16);

    min(schemaPath.elementsX, 1);
    max(schemaPath.elementsX, 16);
    min(schemaPath.elementsY, 1);
    max(schemaPath.elementsY, 16);

    min(schemaPath.pitchX, 0);
    max(schemaPath.pitchX, 100);
    min(schemaPath.pitchY, 0);
    max(schemaPath.pitchY, 100);

    min(schemaPath.pitch, 0);
    max(schemaPath.pitch, 100);

    min(schemaPath.diameter, 0);
    max(schemaPath.diameter, 5);

    min(schemaPath.elementCount, 1);
    max(schemaPath.elementCount, 100);
  });

  updateForm = effect(() => {
    const config = this.store.arrayConfig().config;
    this.form().reset({
      diameter: 0.05,
      elementCount: 7,
      elements: 2,
      startWithZero: false,
      omitCenter: false,
      pitchX: 10,
      pitchY: 10,
      pitch: 10,
      elementsX: 2,
      elementsY: 2,
      ...config,
      ...(config.type === 'ura'
        ? {
            pitchX: config.pitchX * 1e3,
            pitchY: config.pitchY * 1e3,
          }
        : {}),
      ...(config.type === 'hex'
        ? {
            elements: config.elements,
            pitch: config.pitch * 1e3,
          }
        : {}),
    });
  });

  updateStore = effect(() => {
    const formValue = this.form();
    if (formValue.dirty()) {
      let config = { ...formValue.value() } as ArrayGeometry;

      switch (config.type) {
        case 'circular':
          config = {
            type: 'circular',
            diameter: config.diameter,
            elementCount: config.elementCount,
          };
          break;
        case 'free':
          config = {
            type: 'free',
            positions: [] as Point[],
          };
          break;
        case 'hex':
          config = {
            type: 'hex',
            elements: config.elements,
            pitch: config.pitch * 1e-3,
            omitCenter: config.omitCenter,
          };
          break;
        case 'spiral':
          config = {
            type: 'spiral',
            diameter: config.diameter,
            elementCount: config.elementCount,
            startWithZero: config.startWithZero,
          };
          break;
        case 'ura':
          config = {
            type: 'ura',
            elementsX: config.elementsX,
            elementsY: config.elementsY,
            pitchX: config.pitchX * 1e-3,
            pitchY: config.pitchY * 1e-3,
          };
          break;
        default:
          throw new Error('Unknown config type');
      }

      this.store.setConfig({
        config,
      });
    }
  });

  async importFromClipboard() {
    try {
      const clipboardContents = await navigator.clipboard.read();
      for (const item of clipboardContents) {
        if (!item.types.includes('text/plain')) {
          throw new Error('Clipboard does not contain suitable text data.');
        }
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        const lines = text.split('\n').filter((line) => line.trim() !== '');
        console.log(lines);
        const positions = lines.map((line) => {
          const [x, y] = line
            .split('\t')
            .map((coord) => parseFloat(coord.trim().replace(',', '.')));
          return { x, y };
        });

        this.store.setConfig({ config: { type: 'free', positions } } as ArrayConfig);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
