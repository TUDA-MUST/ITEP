import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';

import { type ArrayConfig, type ArrayConfigType, StoreService } from 'src/app/store/store.service';
import { form, FormField, min, max } from '@angular/forms/signals';
import type { Point } from 'src/app/store/export.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-array-config',
  templateUrl: './array-config.component.html',
  styleUrl: './array-config.component.scss',
  imports: [MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatCheckbox, FormField],
})
export class ArrayConfigComponent {
  private store = inject(StoreService);

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
      this.store.setConfig({
        config: {
          ...formValue.value(),
          ...(formValue.value().type === 'ura'
            ? {
                pitchX: formValue.value().pitchX * 1e-3,
                pitchY: formValue.value().pitchY * 1e-3,
              }
            : {}),
          ...(formValue.value().type === 'hex' ? { pitch: formValue.value().pitch * 1e-3 } : {}),
          ...(formValue.value().type === 'free' ? { positions: [] as Point[] } : {}),
        },
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
