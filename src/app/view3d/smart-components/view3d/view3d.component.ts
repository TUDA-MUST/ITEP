import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FarfieldRendererComponent } from '../../renderers/farfield/farfield-renderer.component';
import { RayleighIntegralRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-renderer.component';
import { RayleighProbeRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-probe-renderer.component';
import { RayleighVectorRaysRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-vector-rays-renderer.component';
import { TransducerBufferComponent } from '../../shared/transducer-buffer.component';
import { ExcitationRendererComponent } from '../../renderers/excitation/excitation-renderer.component';
import { BabylonJSViewDirective } from '../babylon-jsview/babylon-jsview.directive';

import { Results } from 'src/app/store/viewportConfig.state';
import { ExportRendererComponent } from '../../renderers/export/export.component';
import { ExportImageRendererComponent } from '../../renderers/export-image/export-image-renderer.component';
import type { ResultValues } from 'src/app/store/export.state';
import type { RayleighProbePoint } from 'src/app/store/rayleigh.state';
import { type ArrayConfig, StoreService } from 'src/app/store/store.service';

@Component({
  selector: 'app-view3d',
  templateUrl: './view3d.component.html',
  styleUrl: './view3d.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BabylonJSViewDirective,
    ExcitationRendererComponent,
    ExportRendererComponent,
    ExportImageRendererComponent,
    TransducerBufferComponent,
    RayleighProbeRendererComponent,
    RayleighIntegralRendererComponent,
    RayleighVectorRaysRendererComponent,
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
  rayleighVectorModeEnabled = this.store.vectorModeEnabled;
  rayleighProbePoint = this.store.probePoint;
  readonly farfieldEnabled = computed(() => this.store.enabledResults().includes(Results.Farfield));
  k = this.store.k;
  globalPhase = this.store.globalPhase;
  readonly ura = computed(() => this.store.arrayConfig().config.type === 'ura');
  transducers = this.store.transducers;

  arrayConfig = this.store.arrayConfig;

  selection = this.store.selection;
  beamforming = this.store.beamforming;

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

  onRayleighProbePointChanged(point: RayleighProbePoint) {
    this.store.setProbePoint(point);
  }
}
