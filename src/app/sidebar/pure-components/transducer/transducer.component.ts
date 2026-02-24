import {
  ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { form, FormField, min, max } from '@angular/forms/signals';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';

import { StoreService, TransducerModel } from 'src/app/store/store.service';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transducer',
  imports: [
    MatInput,
    MatFormField,
    MatSuffix,
    MatLabel,
    MatButtonToggleModule,
    FormField
],
  templateUrl: './transducer.component.html',
  styleUrl: './transducer.component.scss'
})
export class TransducerComponent {
  private store = inject(StoreService);

  protected readonly transducerModel = signal({
    transducerModel: 'Point' as TransducerModel,
    transducerDiameter: 0
  });

  protected transducerForm = form(this.transducerModel, (schemaPath) => {
    min(schemaPath.transducerDiameter, 0);
    max(schemaPath.transducerDiameter, 5000);
  });

  updateForm = effect(() => {
      const config = this.store.arrayConfig();
      this.transducerForm().reset({
        transducerModel: config.transducerModel,
        transducerDiameter: config.transducerDiameter * 1e3,
      });
  });

  updateStore = effect(() => this.transducerForm().dirty() && this.store.setTransducer({
      transducerDiameter: this.transducerForm.transducerDiameter().value() * 1e-3,
      transducerModel: this.transducerForm.transducerModel().value()
    })
  );
}
