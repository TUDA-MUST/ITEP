import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  model,
  signal,
} from '@angular/core';

import { ResultAspect } from '../../../view3d/materials/rayleigh.material';

import { Results } from 'src/app/store/viewportConfig.state';
import { type ResultSet } from 'src/app/store/rayleigh.state';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { StoreService } from 'src/app/store/store.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField, disabled } from '@angular/forms/signals';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rayleigh',
  templateUrl: './rayleigh.component.html',
  styleUrl: './rayleigh.component.scss',
  imports: [
    FormField,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCheckboxModule,
    MatButtonModule,
    MatIconButton,
    MatIconModule,
  ],
})
export class RayleighComponent {
  // Publish enums to template
  public ResultAspect = ResultAspect;
  private store = inject(StoreService);

  protected readonly formModel = signal({
    rayleighVisible: false,
    rayleighAspect: ResultAspect.Elongation,
    resultSet: 'XZPlane' as ResultSet,
  });

  protected readonly phaseEnabled = computed(
    () =>
      [ResultAspect.Phase, ResultAspect.Elongation].includes(this.store.aspect()) &&
      this.store.enabledResults().includes(Results.RayleighIntegral),
  );

  protected form = form(this.formModel, (schemaPath) => {
    disabled(schemaPath.rayleighAspect, ({ valueOf }) => !valueOf(schemaPath.rayleighVisible));
    disabled(schemaPath.resultSet, ({ valueOf }) => !valueOf(schemaPath.rayleighVisible));
  });

  updateForm = effect(() =>
    this.form().reset({
      rayleighVisible: this.store.enabledResults().includes(Results.RayleighIntegral),
      rayleighAspect: this.store.aspect(),
      resultSet: this.store.resultSet(),
    }),
  );

  updateStore = effect(() => {
    const formValue = this.formModel();
    if (this.form().dirty()) {
      this.store.setResultVisible(Results.RayleighIntegral, formValue.rayleighVisible);
      this.store.setAspect(formValue.rayleighAspect);
      this.store.setResultSet(formValue.resultSet);
    }
  });

  ////
  public readonly animateTimer = signal<number | undefined>(undefined);
  public readonly phase = model(0);

  updateGlobalPhase = effect(() => this.store.setGlobalPhase(this.phase()));
  startTimer() {
    if (this.animateTimer() === undefined) {
      this.animateTimer.set(
        window.setInterval(() => this.phase.update((v) => (v > 2 * Math.PI ? 0.1 : v + 0.1)), 100),
      );
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
