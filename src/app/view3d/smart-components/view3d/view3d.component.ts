import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FarfieldRendererComponent } from '../../renderers/farfield/farfield-renderer.component';
import { RayleighIntegralRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-renderer.component';
import { TransducerBufferComponent } from '../../shared/transducer-buffer.component';
import { ExcitationRendererComponent } from '../../renderers/excitation/excitation-renderer.component';
import { BabylonJSViewComponent } from '../babylon-jsview/babylon-jsview.component';

import { Results } from 'src/app/store/viewportConfig.state';
import { ExportRendererComponent } from '../../renderers/export/export.component';
import { type ResultValues } from 'src/app/store/export.state';
import { type ArrayConfig, StoreService } from 'src/app/store/store.service';

@Component({
  selector: 'app-view3d',
  templateUrl: './view3d.component.html',
  styleUrl: './view3d.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BabylonJSViewComponent,
    ExcitationRendererComponent,
    ExportRendererComponent,
    TransducerBufferComponent,
    RayleighIntegralRendererComponent,
    FarfieldRendererComponent,
  ],
})
export class View3dComponent {
  store = inject(StoreService);

  readonly rayleighEnabled = computed(() =>
    this.store.enabledResults().includes(Results.RayleighIntegral),
  );

  rayleighAspect = this.store.aspect;
  rayleighResultSet = this.store.resultSet;
  readonly farfieldEnabled = computed(() => this.store.enabledResults().includes(Results.Farfield));
  k = this.store.k;
  globalPhase = this.store.globalPhase;
  readonly ura = computed(() => this.store.arrayConfig().config.type === 'ura');

  transducers = this.store.transducers;

  arrayConfig = this.store.arrayConfig;

  selection = this.store.selection;
  beamforming = this.store.beamforming;

  readonly transducerDiameter = computed(() => this.arrayConfig().transducerDiameter);
  readonly transducerModel = computed(() => this.arrayConfig().transducerModel);

  public transducerHovered(transducerId: number): void {
    this.store.setHovered(transducerId);
  }

  public setArrayConfig(arrayConfig: ArrayConfig): void {
    this.store.setConfig(arrayConfig);
  }

  onNewResults(results: ResultValues) {
    if (results) {
      this.store.setResultValues(results);
    }
  }
}
