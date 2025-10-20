import { Component, computed, effect, inject, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ResultAspect } from '../../../view3d/materials/rayleigh.material';

import { Results } from 'src/app/store/viewportConfig.state';
import { ResultSet } from 'src/app/store/rayleigh.state';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { StoreService } from 'src/app/store/store.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-rayleigh',
    templateUrl: './rayleigh.component.html',
    styleUrls: ['./rayleigh.component.scss'],
    imports: [ ReactiveFormsModule, MatButtonToggle, MatButtonToggleGroup, MatCheckboxModule, MatButtonModule, MatIconButton, MatIconModule ]
})
export class RayleighComponent {
  private store = inject(StoreService);
  private fb = inject(FormBuilder);

  public rayleighVisible$ = computed(() => this.store.enabledResults().includes(Results.RayleighIntegral));
  public rayleighVisible = this.fb.control(false);
  public rayleighAspect = this.fb.control(0);
  public resultSet = this.fb.control<ResultSet>('XZPlane');

  // Publish enums to template
  public ResultAspect = ResultAspect;

  public animateTimer = signal<number | undefined>(undefined);
  public phase = model(0);

  updateGlobalPhase = effect(() => this.store.setGlobalPhase(this.phase()));
  updateForm = effect(() => this.rayleighVisible.patchValue(this.rayleighVisible$(), { emitEvent: false }));

  constructor() {
    this.rayleighVisible.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.store.setResultVisible(Results.RayleighIntegral, val!);
    });

    this.rayleighAspect.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.store.setAspect(val!);
    });

    this.resultSet.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.store.setResultSet(val!);
    });
  }

  startTimer() {
    if (this.animateTimer() === undefined) {
      this.animateTimer.set(window.setInterval(() => {
        this.phase.update(v => v > 2*Math.PI ? 0.1 : v + 0.1);
      }, 100));
  }
  }

  stopTimer() {
    if (this.animateTimer() !== undefined) {
      window.clearInterval(this.animateTimer());
      this.animateTimer.set(undefined);
    }
  }

  setPhase(event: Event) {
    const input = event.target as HTMLInputElement;
    this.phase.set(input.valueAsNumber);
  }

  resetPhase() {
    this.phase.set(0);
  }
}
