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
  });

  protected transducerForm = form(this.transducerModel, (schemaPath) => {
    min(schemaPath.transducerDiameter, 0);
    max(schemaPath.transducerDiameter, 5000);
  });

  updateForm = effect(() => {
    const config = this.store.arrayConfig();
    const model = config.transducerModel;
    const transducerModel = model.type;
    const transducerDiameter = transducerModel === 'Piston' ? model.diameter * 1e3 : 1;
    this.transducerForm().reset({
      transducerModel,
      transducerDiameter,
    });
  });

  updateStore = effect(() => {
    if (this.transducerForm().dirty()) {
      const type = this.transducerForm.transducerModel().value();
      const transducer =
        type === 'Piston'
          ? { type, diameter: this.transducerForm.transducerDiameter().value() * 1e-3 }
          : { type };
      console.log('Setting transducer in store: ', transducer);
      this.store.setTransducer(transducer);
    }
  });
}
