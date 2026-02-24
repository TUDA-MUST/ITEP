import { Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';

import { StoreService, Environment, FrequencyMultiplier } from 'src/app/store/store.service';

@Component({
  selector: 'app-excitation',
  imports: [  
        MatButtonToggle,
        MatButtonToggleGroup,
        MatInput,
        MatFormField,
        MatSuffix,
        MatLabel,
        ReactiveFormsModule
   ],
  templateUrl: './excitation.component.html',
  styleUrl: './excitation.component.scss'
})
export class ExcitationComponent {
  constructor() {
    effect(() => {
      this.form.patchValue(this.store.arrayConfig().environment, { emitEvent: false })
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed()).subscribe(val => 
        this.store.setEnvironment(val as Partial<Environment>)
    );
  }
  
  fb = inject(FormBuilder);
  store = inject(StoreService);
  public form = this.fb.group({
    excitationFrequencyMultiplier: ['kHz' as FrequencyMultiplier],
    excitationFrequencyBase: [0],
  });

  public readonly environment = computed(() => this.store.arrayConfig().environment);
}
