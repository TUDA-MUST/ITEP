import { Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';

import { ArrayConfig, StoreService } from 'src/app/store/store.service';
import { MatButtonModule, MatAnchor, MatIconButton } from "@angular/material/button";
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-array-config',
  templateUrl: './array-config.component.html',
  styleUrls: ['./array-config.component.scss'],
  imports: [
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatAnchor,
    MatIcon,
    MatIconButton
  ]
})
export class ArrayConfigComponent {
  private store = inject(StoreService);
  private fb = inject(FormBuilder);
  public arrayConfig = this.fb.group({
      type: 'ura',
      elementsX: this.fb.control(0),
      elementsY: this.fb.control(0),
      pitchX: this.fb.control(0),
      pitchY: this.fb.control(0),
      diameter: this.fb.control(0.05),
      elementCount: this.fb.control(5),
      startWithZero: this.fb.control(false),
      omitCenter: this.fb.control(false),
      elements: this.fb.control(2),
      pitch: this.fb.control(5),
  });

  protected transducerCount = computed(() => this.store.transducers().length);

  updateForm = effect(() => {
    const config = this.store.arrayConfig().config;    
    this.arrayConfig.patchValue({
      ...config,
      ...config.type === 'ura' ? {
      pitchX: config.pitchX * 1e3,
      pitchY: config.pitchY * 1e3,
      } : {},
      ...config.type === 'hex' ? {
        elements: config.elements,
        pitch: config.pitch * 1e3,
      } : {},
    }, { emitEvent: false });
  });

  constructor() {
    this.arrayConfig.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => 
      this.store.setConfig({config: {
        ...value,
        ...value.type === 'ura' && value.pitchX !== undefined && value.pitchX !== null ? { pitchX: value.pitchX * 1e-3 } : {},
        ...value.type === 'ura' && value.pitchY !== undefined && value.pitchY !== null ? { pitchY: value.pitchY * 1e-3 } : {},
        ...value.type === 'hex' && value.pitch !== undefined && value.pitch !== null ? { pitch: value.pitch * 1e-3 } : {},
        ...value.type === 'free' ? { positions: [] } : {},
      }} as ArrayConfig));
  }

  async importFromClipboard() {
    try {
      const clipboardContents = await navigator.clipboard.read();
      for (const item of clipboardContents) {
        if (!item.types.includes("text/plain")) {
          throw new Error("Clipboard does not contain suitable text data.");
        }
        const blob = await item.getType("text/plain");
        const text = await blob.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        console.log(lines);
        const positions = lines.map(line => {
          const [x, y ] = line.split('\t').map(coord => parseFloat(coord.trim().replace(',', '.')));
          return { x, y };
        });

        this.store.setConfig({ config: { type: 'free', positions } } as ArrayConfig); 
      }
    } catch (error) {
      console.log(error);
    }
  }
}
