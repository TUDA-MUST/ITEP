import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { StoreService } from 'src/app/store/store.service';
import { Results } from 'src/app/store/viewportConfig.state';
import { AxisRendererComponent } from '../../renderers/axis/axis-renderer.component';
import { ExcitationRendererComponent } from '../../renderers/excitation/excitation-renderer.component';
import { ExportImageRendererComponent } from '../../renderers/export-image/export-image-renderer.component';
import { FarfieldRendererComponent } from '../../renderers/farfield/farfield-renderer.component';
import { RayleighProbeRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-probe-renderer.component';
import { RayleighIntegralRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-renderer.component';
import { RayleighVectorRaysRendererComponent } from '../../renderers/rayleigh-integral/rayleigh-vector-rays-renderer.component';
import { waveNumber } from '../../shared/wave-number';
import { LiteRendererResourcesDirective } from '../lite-renderer-resources/lite-renderer-resources.directive';
import { LiteViewDirective } from '../lite-view/lite-view.directive';

@Component({
  selector: 'app-lite-renderer-view',
  template: `
    <canvas
      liteview
      appLiteRendererResources
      [transducers]="store.transducers()"
      [beamforming]="store.beamforming()"
      [k]="k()"
    >
      <app-excitation-renderer
        [transducers]="store.transducers()"
        [transducerModel]="transducerModel()"
        [selection]="store.selection()"
        (hovered)="onTransducerHovered($event)"
      />
      <app-rayleigh-integral-renderer
        [transducers]="store.transducers()"
        [environment]="store.arrayConfig().environment"
        [resultSet]="store.resultSet()"
        [aspect]="store.aspect()"
        [globalPhase]="store.globalPhase()"
        [enabled]="rayleighEnabled()"
        [vectorModeEnabled]="store.vectorModeEnabled()"
      />
      <app-rayleigh-probe-renderer
        [transducers]="store.transducers()"
        [enabled]="rayleighEnabled() && store.vectorModeEnabled()"
        [resultSet]="store.resultSet()"
        [point]="store.probePoint()"
        (pointChange)="store.setProbePoint($event)"
      />
      <app-rayleigh-vector-rays-renderer
        [transducers]="store.transducers()"
        [enabled]="rayleighEnabled() && store.vectorModeEnabled()"
        [point]="store.probePoint()"
      />
      <app-farfield-renderer
        [transducers]="store.transducers()"
        [environment]="store.arrayConfig().environment"
        [transducerModel]="transducerModel()"
        [enabled]="farfieldEnabled()"
      />
      <app-axis-renderer />
      <app-export-image-renderer
        [transducers]="store.transducers()"
        [environment]="store.arrayConfig().environment"
        [resultSet]="store.resultSet()"
        [aspect]="store.aspect()"
        [globalPhase]="store.globalPhase()"
        [enabled]="rayleighEnabled()"
      />
    </canvas>
  `,
  styles: `
    canvas {
      position: absolute;
      outline: none;
      overflow: hidden;
      width: 100%;
      height: 100%;
      display: block;
      visibility: hidden;
      background-color: #333333;
    }

    canvas.lite-view-ready {
      visibility: visible;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxisRendererComponent,
    ExcitationRendererComponent,
    ExportImageRendererComponent,
    FarfieldRendererComponent,
    LiteRendererResourcesDirective,
    LiteViewDirective,
    RayleighIntegralRendererComponent,
    RayleighProbeRendererComponent,
    RayleighVectorRaysRendererComponent,
  ],
})
export class LiteRendererViewComponent {
  readonly store = inject(StoreService);
  readonly rayleighEnabled = computed(() =>
    this.store.enabledResults().includes(Results.RayleighIntegral),
  );
  readonly farfieldEnabled = computed(() => this.store.enabledResults().includes(Results.Farfield));
  readonly transducerModel = computed(() => this.store.arrayConfig().transducerModel);
  readonly k = computed(() => waveNumber(this.store.arrayConfig().environment));

  onTransducerHovered(index: number): void {
    if (index >= 0) this.store.setHovered(index);
    else this.store.clearHovered();
  }
}
