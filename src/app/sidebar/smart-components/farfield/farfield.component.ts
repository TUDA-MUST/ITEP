import { Component, effect, inject, signal } from '@angular/core';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { Results } from 'src/app/store/viewportConfig.state';
import { StoreService } from 'src/app/store/store.service';
import { form, FormField } from '@angular/forms/signals';

@Component({
    selector: 'app-farfield',
    templateUrl: './farfield.component.html',
    styleUrls: ['./farfield.component.scss'],
    imports: [MatCheckboxModule, FormField]
})
export class FarfieldComponent {
  private store = inject(StoreService);
  
  protected farfieldModel = signal(false);
  protected farfieldForm = form(this.farfieldModel);

  updateForm = effect(() => {
      this.farfieldForm().reset(this.store.enabledResults().includes(Results.Farfield));
    });
  updateStore = effect(() => this.farfieldForm().dirty() && this.store.setResultVisible(Results.Farfield, this.farfieldModel()));
}
