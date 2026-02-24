import { Component, computed, effect, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Angle } from '@babylonjs/core/Maths/math.path';
import { StoreService } from 'src/app/store/store.service';
import { JoystickComponent } from '../joystick/joystick.component';
import { AzElCoordinates } from 'src/app/store/beamforming.state';
import { deg2rad } from 'src/app/utils/degrad';
import { disabled, FormField, form, max, min } from '@angular/forms/signals';

const normalizeAngle = (angle: number) => {
  return angle > 180 ? angle - 360 : angle;
};

const cleanNullish = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  ) as Partial<T>;

const transformFormPatch = (
  patch: Partial<{ beamformingEnabled: boolean | null; az: number | null; el: number | null; }>
) => {
  const clean = cleanNullish(patch) as { beamformingEnabled?: boolean; az?: number; el?: number; };

  if (typeof clean.az === 'number') clean.az = deg2rad(clean.az);
  if (typeof clean.el === 'number') clean.el = deg2rad(clean.el);

  return clean;
};

@Component({
    selector: 'app-beamforming',
    imports: [
      MatButtonModule,
      MatCheckboxModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      JoystickComponent,
      FormField
    ],
    templateUrl: './beamforming.component.html',
    styleUrl: './beamforming.component.scss'
})
export class BeamformingComponent {
  store = inject(StoreService);
  
  readonly formModel = signal({
    beamformingEnabled: false,
    az: 0,
    el: 0
  });

  readonly beamformingEnabled = computed(() => this.store.beamforming().beamformingEnabled);
  readonly beamforming = computed(() => this.store.beamforming());

  form = form(this.formModel, (schemaPath) => {
    disabled(schemaPath.az, ({valueOf}) => !valueOf(schemaPath.beamformingEnabled));
    disabled(schemaPath.el, ({valueOf}) => !valueOf(schemaPath.beamformingEnabled));
    min(schemaPath.az,  -180);
    max(schemaPath.az,  180);
    min(schemaPath.el,  -180);
    max(schemaPath.el,  180);
  });

  updateStoreFromForm = effect(() => {
    const formValue = this.formModel();
    if (this.form().dirty()) {
      this.store.setPartial({
        ...formValue,
        az: deg2rad(formValue.az),
        el: deg2rad(formValue.el)
      });
    }
  });
  
  updateFormFromStore = effect(() => {
    const bf = this.store.beamforming();
    this.form().reset({
      beamformingEnabled: bf?.beamformingEnabled,
      az: normalizeAngle(Angle.FromRadians(bf.az).degrees()),
      el: normalizeAngle(Angle.FromRadians(bf.el).degrees())
    });
  });
  
  resetBeamforming() {
    this.store.resetBeamforming();
  }

  setAzEl(azel: AzElCoordinates) {
    this.store.setPartial(azel);
  }  
}
