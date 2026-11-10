import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { BarChart, type BarSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import { init, use, type ComposeOption, type ECharts } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { AreaBin } from 'src/app/core/voronoi';

type ChartOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>;

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const formatArea = (area: number, precision: number) =>
  Number((area * 1e6).toPrecision(precision)).toString();

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-aperture-area-chart',
  templateUrl: './aperture-area-chart.component.html',
  styles: `
    figure {
      margin: 0;
    }
    .chart {
      width: 100%;
      height: 200px;
    }
  `,
})
export class ApertureAreaChartComponent {
  readonly bins = input.required<readonly AreaBin[]>();
  readonly labelledBy = input.required<string>();
  readonly binPreview = output<AreaBin | null>();
  private readonly rows = computed(() => {
    const bins = this.bins();
    const discreteAreas = bins.flatMap((bin) => ('area' in bin ? [bin.area] : []));
    let areaPrecision = 4;
    while (
      areaPrecision < 12 &&
      new Set(discreteAreas.map((area) => formatArea(area, areaPrecision))).size <
        discreteAreas.length
    ) {
      areaPrecision++;
    }
    return bins.map((bin) => {
      const count = bin.areaIndices.length;
      const cells = `${count} ${count === 1 ? 'cell' : 'cells'}`;
      if ('area' in bin) {
        const label = formatArea(bin.area, areaPrecision);
        return {
          label,
          tooltip: label,
          description: `${cells} at ${label} square millimetres.`,
          count,
        };
      }
      const { lower, upper } = bin;
      const precision = Math.max(3, Math.ceil(Math.log10(upper / (upper - lower))) + 2);
      const start = formatArea(lower, precision);
      const end = formatArea(upper, precision);
      return {
        label: formatArea((lower + upper) / 2, precision),
        tooltip: `${start}–${end}`,
        description: `${cells} from ${start} to ${end} square millimetres.`,
        count,
      };
    });
  });

  readonly description = computed(() => {
    const bins = this.rows().filter(({ count }) => count > 0);
    return `Voronoi cell area distribution. ${bins.map(({ description }) => description).join(' ')}`;
  });

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('chartHost');
  private readonly chart = signal<ECharts | null>(null);
  private readonly destroyRef = inject(DestroyRef);

  private previewBin(index: number | null) {
    this.binPreview.emit(index === null ? null : (this.bins()[index] ?? null));
  }

  constructor() {
    afterNextRender(() => {
      const host = this.host().nativeElement;
      const observer = new ResizeObserver(() => {
        if (!host.clientWidth || !host.clientHeight) return;
        const chart = this.chart();
        if (chart) chart.resize();
        else {
          const instance = init(host, 'dark');
          instance.on('mouseover', 'series.bar', ({ dataIndex }) => this.previewBin(dataIndex));
          instance.on('mouseout', 'series.bar', () => this.previewBin(null));
          instance.on('globalout', () => this.previewBin(null));
          this.chart.set(instance);
        }
      });
      observer.observe(host);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        this.chart()?.dispose();
      });
    });

    effect(() => {
      const chart = this.chart();
      if (!chart) return;
      const rows = this.rows();
      const discrete = this.bins().every((bin) => 'area' in bin);
      const options: ChartOption = {
        animation: false,
        backgroundColor: 'transparent',
        grid: { left: 36, right: 12, top: 26, bottom: 44 },
        xAxis: {
          type: 'category',
          name: 'Cell area (mm²)',
          nameLocation: 'middle',
          nameGap: 28,
          data: rows.map((row) => row.label),
        },
        yAxis: { type: 'value', name: 'Cells', minInterval: 1 },
        tooltip: {
          trigger: 'item',
          renderMode: 'richText',
          formatter: (params) => {
            const item = Array.isArray(params) ? params[0] : params;
            const row = rows[item.dataIndex];
            return `${row.tooltip} mm²\nCells: ${row.count}`;
          },
        },
        series: [
          {
            type: 'bar',
            data: rows.map((row) => row.count),
            barCategoryGap: discrete ? '40%' : '0%',
            itemStyle: { color: '#bda8ff', borderWidth: 1, borderColor: '#292530' },
          },
        ],
      };
      chart.setOption(options);
    });
  }
}
