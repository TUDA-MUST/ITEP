import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { form, FormField, min, max } from '@angular/forms/signals';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import type { TransducerModel } from 'src/app/core/transducer';

import { StoreService } from 'src/app/store/store.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transducer',
  imports: [MatInput, MatFormField, MatSuffix, MatLabel, MatButtonToggleModule, FormField],
  templateUrl: './transducer.component.html',
  styleUrl: './transducer.component.scss',
})
export class TransducerComponent {
  private store = inject(StoreService);

  protected readonly transducerModel = signal({
    transducerModel: 'Point' as TransducerModel,
    transducerDiameter: 0,
    transducerWidth: 0,
    transducerHeight: 0,
  });

  protected transducerForm = form(this.transducerModel, (schemaPath) => {
    min(schemaPath.transducerDiameter, 0);
    max(schemaPath.transducerDiameter, 5000);
    min(schemaPath.transducerWidth, 0);
    max(schemaPath.transducerWidth, 5000);
    min(schemaPath.transducerHeight, 0);
    max(schemaPath.transducerHeight, 5000);
  });

  updateForm = effect(() => {
    const config = this.store.arrayConfig();
    const model = config.transducerModel;
    const transducerModel = model.type;
    // FIXME: Fallback to last used value first
    const transducerDiameter = transducerModel === 'Piston' ? model.diameter * 1e3 : 1;
    const transducerWidth = transducerModel === 'Rectangular' ? model.width * 1e3 : 1;
    const transducerHeight = transducerModel === 'Rectangular' ? model.height * 1e3 : 1;
    this.transducerForm().reset({
      transducerModel,
      transducerDiameter,
      transducerWidth,
      transducerHeight,
    });
  });

  updateStore = effect(() => {
    if (this.transducerForm().dirty()) {
      const type = this.transducerForm.transducerModel().value();
      const transducer = (() => {
        switch (type) {
          case 'Piston':
            return { type, diameter: this.transducerForm.transducerDiameter().value() * 1e-3 };
          case 'Rectangular':
            return {
              type,
              width: this.transducerForm.transducerWidth().value() * 1e-3,
              height: this.transducerForm.transducerHeight().value() * 1e-3,
            };
          default:
            return { type };
        }
      })();
      console.log('Setting transducer in store: ', transducer);
      this.store.setTransducer(transducer);
    }
  });
}
