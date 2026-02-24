import { Component, computed, inject } from '@angular/core';
import { FarfieldComponent } from '../../smart-components/farfield/farfield.component';
import { RayleighComponent } from '../../smart-components/rayleigh/rayleigh.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChartComponent } from '../../smart-components/chart/chart.component';
import { MatIconModule } from '@angular/material/icon';
import { Results } from 'src/app/store/viewportConfig.state';

import { version } from '../../../../../package.json';
import { HoveredKpi, KPIComponent } from '../kpi/kpi.component';
import { ApertureViewComponent } from '../aperture-view/aperture-view.component';
import { StoreService } from 'src/app/store/store.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
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
        RayleighComponent,
        MatButtonModule
    ]
})
export class ResultContainerComponent {
    public version = version;
    private readonly store = inject(StoreService);
    private readonly snackBar = inject(MatSnackBar);

    readonly kpis = computed(() => this.store.lowTechKPis());

    public readonly farfieldVisible = computed(() => this.store.enabledResults().includes(Results.Farfield));
    public transducers = this.store.transducers;
    public readonly diameter = computed(() => this.store.arrayConfig().transducerDiameter);
    public readonly arrayDiameter = computed(() => {
        const config = this.store.arrayConfig().config;
        if (config.type === 'circular' || config.type === 'spiral') {
            return config.diameter
        }
        return null;
    });
    public readonly transducerModel = computed(() => this.store.arrayConfig().transducerModel);
    public readonly transducersCount = computed(() => this.transducers().length);
    public readonly rayleighVisible = computed(() => this.store.enabledResults().includes(Results.RayleighIntegral));
    public setHoveredKpi(hoveredKpi: HoveredKpi) {
        this.store.setHoveredKpi(hoveredKpi);
    }

  exportAperture() {
    navigator.clipboard.writeText(
      this.transducers().reduce((acc, t) => 
        acc + `${t.pos.x}\t${t.pos.y}\n`, 
      `# Array configuration exported from: x;y\n` ));
    this.snackBar.open(`Transducer positions copied to clipboard`, 'Close', {
      duration: 1000
    });
  }

  private readonly chartsString = computed(() => this.store.crossPattern().reduce((acc, line) => {
    const values = [
      line.angle,
      line.az,
      line.el
    ].map(value => value.toString());
    const [angle, az, el] = values;
    return acc + `${angle}\t${az}\t${el}\n`;
  }, `# Chart exported from: angle;az;el\n`));
    
  exportChart() {
    navigator.clipboard.writeText(this.chartsString());
    this.snackBar.open(`Chart data copied to clipboard`, 'Close', {
      duration: 1000
    });
  }
}
