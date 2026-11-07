import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type AfterViewInit,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, type LineSeriesOption } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  type TooltipComponentOption,
  type GridComponentOption,
  type MarkAreaComponentOption,
  type MarkLineComponentOption,
} from 'echarts/components';
import type { XAxisComponentOption, YAxisComponentOption } from 'echarts';
import type { PSFResult } from 'src/app/core/report';
import type { HoveredKpi } from '../../pure-components/kpi/kpi.component';
import { StoreService } from 'src/app/store/store.service';
import { rad2deg } from 'src/app/utils/degrad';

type ChartOption = echarts.ComposeOption<
  | LineSeriesOption
  | TooltipComponentOption
  | GridComponentOption
  | MarkAreaComponentOption
  | MarkLineComponentOption
>;
type Plane = 'az' | 'el';
type PatternPoint = [angle: number, db: number];
type Highlight =
  { kind: 'none' } | { kind: 'band'; left: number; right: number } | { kind: 'level'; db: number };

const degreeFormatter = (value: number) => `${value.toFixed(0)}°`;
const amplitudeToDb = (value: number) => 20 * Math.log10(Math.max(Math.abs(value), 1e-12));
const splitLine = {
  show: true,
  lineStyle: { color: '#444444', width: 1, type: 'solid' as const },
};
const planes = [
  {
    plane: 'az',
    axisIndex: 0,
    name: 'u',
    lineColor: 'rgba(192, 0, 0, 0.8)',
    markerColor: 'red',
    areaColor: 'rgba(255, 0, 0, 0.1)',
  },
  {
    plane: 'el',
    axisIndex: 1,
    name: 'v',
    markerColor: 'rgba(64, 192, 64, 1.0)',
    areaColor: 'rgba(0, 255, 0, 0.1)',
  },
] as const;

echarts.use([
  TooltipComponent,
  GridComponent,
  CanvasRenderer,
  LineChart,
  MarkAreaComponent,
  MarkLineComponent,
]);

function buildAngleAxis(gridIndex: number): XAxisComponentOption {
  return {
    id: `angle-${gridIndex}`,
    gridIndex,
    type: 'value',
    min: -90,
    max: 90,
    splitNumber: 4,
    axisLabel: {
      inside: false,
      align: 'center',
      verticalAlign: 'middle',
      padding: gridIndex === 0 ? [10, 10, 10, 10] : [0, 0, 0, 0],
      color: '#e6e1e6',
      formatter: degreeFormatter,
    },
    splitLine,
  };
}

function buildAmplitudeAxis(gridIndex: number): YAxisComponentOption {
  return {
    id: `amplitude-${gridIndex}`,
    gridIndex,
    type: 'value',
    ...(gridIndex === 1 ? { nameLocation: 'end' as const, nameGap: 10 } : {}),
    min: -30,
    max: 0,
    minorSplitLine: { show: false },
    axisLabel: {
      color: '#e6e1e6',
      inside: true,
      align: 'right',
      verticalAlign: 'middle',
      padding: [0, 10, 0, 0],
    },
    splitLine,
  };
}

function buildBaseOptions(): ChartOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        return `${item.seriesName} <br> ${item.name} : ${item.value ?? '?'}`;
      },
    },
    grid: [
      { top: '7%', left: '3%', right: '3%', height: '40%', containLabel: true },
      { top: '55%', left: '3%', right: '3%', height: '45%', containLabel: true },
    ],
    xAxis: planes.map(({ axisIndex }) => buildAngleAxis(axisIndex)),
    yAxis: planes.map(({ axisIndex }) => buildAmplitudeAxis(axisIndex)),
    series: planes.map(buildPatternSeries),
    animation: false,
  };
}

function buildPatternSeries(config: {
  plane: Plane;
  axisIndex: number;
  name: string;
  lineColor?: string;
  markerColor: string;
  areaColor: string;
}): LineSeriesOption {
  return {
    id: config.plane,
    name: config.name,
    type: 'line',
    xAxisIndex: config.axisIndex,
    yAxisIndex: config.axisIndex,
    showSymbol: false,
    ...(config.lineColor ? { lineStyle: { color: config.lineColor } } : {}),
    data: [],
    markLine: {
      symbol: ['none', 'none'],
      label: { show: false },
      lineStyle: { color: config.markerColor, width: 2, type: 'dashed' },
      data: [],
    },
    markArea: {
      silent: true,
      itemStyle: { color: config.areaColor },
      label: { show: false },
      data: [],
    },
  };
}

function getHighlight(plane: Plane, hoveredKpi: HoveredKpi, kpis: PSFResult): Highlight {
  const metrics = kpis[plane];
  const suffix = plane === 'az' ? 'Az' : 'El';
  if (
    hoveredKpi === `Hpbw${suffix}` &&
    metrics.hpbw !== null &&
    metrics.leftHPBWCrossing !== null &&
    metrics.rightHPBWCrossing !== null
  ) {
    return { kind: 'band', left: metrics.leftHPBWCrossing, right: metrics.rightHPBWCrossing };
  }
  if (
    hoveredKpi === `Fnbw${suffix}` &&
    metrics.fnbw !== null &&
    metrics.leftZeroCrossing !== null &&
    metrics.rightZeroCrossing !== null
  ) {
    return { kind: 'band', left: metrics.leftZeroCrossing, right: metrics.rightZeroCrossing };
  }
  if (
    hoveredKpi === `Slr${suffix}` &&
    metrics.slr !== null &&
    metrics.sll !== null &&
    metrics.sll > 0 &&
    metrics.maxl !== null &&
    metrics.maxl > 0
  ) {
    return { kind: 'level', db: amplitudeToDb(metrics.sll / metrics.maxl) };
  }
  return { kind: 'none' };
}

export function buildHighlightOptions(
  plane: Plane,
  hoveredKpi: HoveredKpi,
  kpis: PSFResult,
): Pick<LineSeriesOption, 'markLine' | 'markArea'> {
  const highlight = getHighlight(plane, hoveredKpi, kpis);
  switch (highlight.kind) {
    case 'band':
      return {
        markLine: { data: [{ xAxis: highlight.left }, { xAxis: highlight.right }] },
        markArea: { data: [[{ xAxis: highlight.left }, { xAxis: highlight.right }]] },
      };
    case 'level':
      return { markLine: { data: [{ yAxis: highlight.db }] }, markArea: { data: [] } };
    case 'none':
      return { markLine: { data: [] }, markArea: { data: [] } };
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  imports: [],
})
export class ChartComponent implements AfterViewInit {
  private readonly store = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chart = signal<echarts.ECharts | null>(null);
  readonly echartDiv = viewChild.required<ElementRef<HTMLElement>>('echartDiv');
  readonly dynamicRange = input(30);

  private readonly patternData = computed(() => {
    const samples = this.store.crossPattern();
    const kpis = this.store.kpis();
    const az: PatternPoint[] = [];
    const el: PatternPoint[] = [];
    for (const sample of samples) {
      az.push([sample.angle, amplitudeToDb(sample.az.abs() / (kpis.az.maxl || 1))]);
      el.push([sample.angle, amplitudeToDb(sample.el.abs() / (kpis.el.maxl || 1))]);
    }
    return { az, el };
  });

  private readonly updateChartEffect = effect(() => {
    const chart = this.chart();
    if (!chart) return;
    const data = this.patternData();
    const kpis = this.store.kpis();
    const hoveredKpi = this.store.hoveredKpi();
    const bf = this.store.beamforming();
    const direction = bf?.beamformingEnabled ? bf : { az: 0, el: 0 };
    const option: ChartOption = {
      yAxis: [
        {
          id: 'amplitude-0',
          min: -this.dynamicRange(),
          name: `Norm. Amplit. AZ / dB @ EL = ${rad2deg(direction.el).toFixed(2)}°`,
        },
        {
          id: 'amplitude-1',
          min: -this.dynamicRange(),
          name: `Norm. Amplit. EL / dB @ AZ = ${rad2deg(direction.az).toFixed(2)}°`,
        },
      ],
      series: planes.map(({ plane }): LineSeriesOption => ({
        id: plane,
        data: data[plane],
        ...buildHighlightOptions(plane, hoveredKpi, kpis),
      })),
    };
    chart.setOption(option);
  });

  ngAfterViewInit(): void {
    const chart = echarts.init(this.echartDiv().nativeElement);
    chart.setOption(buildBaseOptions());
    this.chart.set(chart);
    this.destroyRef.onDestroy(() => chart.dispose());
  }
}
