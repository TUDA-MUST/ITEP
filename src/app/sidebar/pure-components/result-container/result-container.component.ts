import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FarfieldComponent } from '../../smart-components/farfield/farfield.component';
import { RayleighComponent } from '../../smart-components/rayleigh/rayleigh.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChartComponent } from '../../smart-components/chart/chart.component';
import { MatIconModule } from '@angular/material/icon';
import { Results } from 'src/app/store/viewportConfig.state';

import { version } from '../../../../../package.json';
import { type HoveredKpi, KPIComponent } from '../kpi/kpi.component';
import { ApertureViewComponent } from '../aperture-view/aperture-view.component';
import { StoreService } from 'src/app/store/store.service';
import { ApertureAreaChartComponent } from '../aperture-area-chart/aperture-area-chart.component';
import { areaHistogram, partitionAperture, type AreaBin } from 'src/app/core/voronoi';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RayleighVectorDiagramComponent } from '../../smart-components/rayleigh-vector-diagram/rayleigh-vector-diagram.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-result-container',
  templateUrl: './result-container.component.html',
  styleUrl: './result-container.component.scss',
  imports: [
    ChartComponent,
    FarfieldComponent,
    MatExpansionModule,
    MatIconModule,
    KPIComponent,
    ApertureViewComponent,
    ApertureAreaChartComponent,
    MatCheckboxModule,
    RayleighComponent,
    RayleighVectorDiagramComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class ResultContainerComponent {
  public version = version;
  private readonly store = inject(StoreService);
  private readonly snackBar = inject(MatSnackBar);

  readonly kpis = computed(() => this.store.kpis());
  readonly dynamicRange = signal(30);

  setDynamicRange(input: HTMLInputElement): void {
    if (input.validity.valid && Number.isFinite(input.valueAsNumber)) {
      this.dynamicRange.set(input.valueAsNumber);
    }
  }

  public readonly farfieldVisible = computed(() =>
    this.store.enabledResults().includes(Results.Farfield),
  );
  public readonly transducers = this.store.transducers;
  public readonly arrayDiameter = computed(() => {
    const config = this.store.arrayConfig().config;
    if (config.type === 'circular' || config.type === 'spiral') {
      return config.diameter;
    }
    return null;
  });
  readonly showVoronoi = signal(false);
  readonly aperturePartition = computed(() =>
    partitionAperture(
      this.transducers().map((t) => t.pos),
      this.arrayDiameter(),
    ),
  );
  readonly areaBins = computed(() =>
    areaHistogram(this.aperturePartition().cells.map((cell) => cell.area)),
  );
  readonly previewedBin = signal<AreaBin | null>(null);
  readonly highlightedCellIndices = computed(() => {
    const bin = this.previewedBin();
    return bin && this.areaBins().includes(bin) ? new Set(bin.areaIndices) : null;
  });

  readonly hasSharedCells = computed(() =>
    this.aperturePartition().cells.some((cell) => cell.indices.length > 1),
  );

  public readonly transducerModel = computed(() => this.store.arrayConfig().transducerModel);
  public readonly transducersCount = computed(() => this.transducers().length);
  public readonly rayleighVisible = computed(() =>
    this.store.enabledResults().includes(Results.RayleighIntegral),
  );
  public readonly rayleighVectorModeEnabled = this.store.vectorModeEnabled;
  public setHoveredKpi(hoveredKpi: HoveredKpi) {
    this.store.setHoveredKpi(hoveredKpi);
  }

  exportAperture() {
    navigator.clipboard.writeText(
      this.transducers().reduce(
        (acc, t) => acc + `${t.pos.x}\t${t.pos.y}\n`,
        `# Array configuration exported from: x;y\n`,
      ),
    );
    this.snackBar.open(`Transducer positions copied to clipboard`, 'Close', {
      duration: 1000,
    });
  }

  private readonly chartsString = computed(() =>
    this.store.crossPattern().reduce((acc, line) => {
      const values = [line.angle, line.az, line.el].map((value) => value.toString());
      const [angle, az, el] = values;
      return acc + `${angle}\t${az}\t${el}\n`;
    }, `# Chart exported from: angle;az;el\n`),
  );

  exportChart() {
    navigator.clipboard.writeText(this.chartsString());
    this.snackBar.open(`Chart data copied to clipboard`, 'Close', {
      duration: 1000,
    });
  }

  exportRayleigh() {
    // Signal the render component to export the current canvas content
    window.dispatchEvent(new CustomEvent('export-rayleigh'));
    this.snackBar.open(`Rayleigh image download started`, 'Close', { duration: 1000 });
  }
}
