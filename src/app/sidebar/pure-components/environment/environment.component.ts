import { Component, effect, inject, signal } from '@angular/core';

import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';

import { StoreService, EnvironmentHint } from 'src/app/store/store.service';
import { disabled, form, Field, min, max } from '@angular/forms/signals';

const presets : Record<EnvironmentHint, number | null> = {
  Air: 343,
  Water: 1482,
  Custom: null
};

@Component({
  selector: 'app-environment',
  imports: [
    MatButtonToggle,
    MatButtonToggleGroup,
    MatInput,
    MatFormField,
    MatSuffix,
    MatLabel,
    Field
  ],
  templateUrl: './environment.component.html',
  styleUrl: './environment.component.scss'
})
export class EnvironmentComponent {
  store = inject(StoreService);

  public environmentModel = signal({
    speedOfSound: presets.Air as number,
    environmentHint: 'Air' as EnvironmentHint,
  });

  public environmentForm = form(this.environmentModel, (schemaPath) => {
    disabled(schemaPath.speedOfSound, ({ valueOf }) => 
      valueOf(schemaPath.environmentHint) !== 'Custom'
    );
    min(schemaPath.speedOfSound, 0);
    max(schemaPath.speedOfSound, 5000);
  });

  updateForm = effect(() => this.environmentForm().reset(this.store.arrayConfig().environment));
  updateStore = effect(() => this.environmentForm().dirty() && this.store.setEnvironment(this.environmentModel()));
}
