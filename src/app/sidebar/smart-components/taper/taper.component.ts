import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatInput } from '@angular/material/input';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { StoreService } from '../../../store/store.service';
import type { TaperConfig } from '../../../core/taper';

@Component({
  selector: 'app-taper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatInput,
    MatButtonToggle,
    MatButtonToggleGroup,
  ],
  template: `
    <div [formGroup]="form" class="controls">
      <mat-button-toggle-group
        aria-label="Amplitude taper"
        hideSingleSelectionIndicator
        formControlName="type"
      >
        <mat-button-toggle value="uniform">Uniform</mat-button-toggle>
        <mat-button-toggle value="taylor">Taylor</mat-button-toggle>
        <mat-button-toggle value="chebyshev" aria-label="Dolph–Chebyshev" title="Dolph–Chebyshev"
          >Dolph–Cheb.</mat-button-toggle
        >
      </mat-button-toggle-group>
      @if (store.taper().type !== 'uniform') {
        <mat-button-toggle-group
          aria-label="Spatial strategy"
          hideSingleSelectionIndicator
          formControlName="strategy"
        >
          <mat-button-toggle value="rectangular">Rectangular</mat-button-toggle>
          <mat-button-toggle value="radial">Radial</mat-button-toggle>
        </mat-button-toggle-group>
        <mat-checkbox formControlName="allowHigherSidelobes">Allow higher sidelobes</mat-checkbox>
      }
      @if (store.taper().type === 'taylor') {
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Near-in sidelobes (nbar)</mat-label>
          <input matInput type="number" formControlName="nbar" min="2" max="10" step="1" />
        </mat-form-field>
      }
    </div>
  `,
  styles: `
    :host,
    .controls {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .controls {
      gap: 0.5rem;
    }
    mat-button-toggle-group {
      align-self: flex-end;
    }
    mat-form-field {
      margin-block-start: 0.5rem;
      inline-size: 100%;
    }
  `,
})
export class TaperComponent {
  readonly store = inject(StoreService);
  readonly form = inject(FormBuilder).nonNullable.group({
    type: ['uniform' as TaperConfig['type']],
    strategy: ['rectangular' as TaperConfig['strategy']],
    allowHigherSidelobes: [false],
    nbar: [
      4,
      [Validators.required, Validators.min(2), Validators.max(10), Validators.pattern(/^\d+$/)],
    ],
  });
  constructor() {
    effect(() =>
      this.form.patchValue(
        {
          ...this.store.taper(),
          allowHigherSidelobes: this.store.taper().allowHigherSidelobes ?? false,
        },
        { emitEvent: false },
      ),
    );
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.form.valid) return;
      const update = this.form.getRawValue();
      const current = this.store.taper();
      if (current.type === 'uniform' && update.type !== 'uniform') {
        const sll = this.store.uniformSll();
        this.store.setTaper({
          ...update,
          sll: Math.max(-80, Math.min(-1, Math.round(sll * 10) / 10)),
        });
      } else {
        this.store.setTaper(update);
      }
    });
  }
}
