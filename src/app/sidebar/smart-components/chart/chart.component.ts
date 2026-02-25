import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  type OnInit,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { LineChart } from 'echarts/charts';

// Import the title, tooltip, rectangular coordinate system, dataset and transform components
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
} from 'echarts/components';
import { type CallbackDataParams, type ECBasicOption } from 'echarts/types/dist/shared';
import { StoreService } from 'src/app/store/store.service';

const degreeFormatter = (value: number) => `${value.toFixed(0)}°`;
const dBFormatter = (value: number) => 20 * Math.log10(Math.abs(value));

const _seriesTemplate = {
  name: 'u',
  type: 'line',
  showSymbol: false,
  lineStyle: {
    color: 'rgba(192, 0, 0, 0.8)',
  },
  data: [], // Data series
  markLine: {
    symbol: ['none', 'none'],
    label: { show: false },
    data: [{ yAxis: 0.1 }],
  },
  markArea: {
    itemStyle: {
      color: 'rgba(255, 0, 0, 0.1)',
    },
    label: {
      position: ['100%', '20%'],
    },
    data: [],
  },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  imports: [],
})
export class ChartComponent implements OnInit {
  private readonly store = inject(StoreService);
  destroyRef = inject(DestroyRef);

  readonly echartDiv = viewChild.required<ElementRef<HTMLElement>>('echartDiv');

  updateChartEffect = effect(() => {
    const hoveredKpi = this.store.hoveredKpi();
    const plotData = this.store.crossPattern();

    const kpis = this.store.lowTechKPis();
    const bf = this.store.beamforming();
    const bfAzEl = bf?.beamformingEnabled ? bf : { az: 0, el: 0 };

    const config = {
      yAxis: [
        {
          type: 'value',
          name: `Norm. Amplit. AZ / dB @ EL = ${((180 * bfAzEl.el) / Math.PI).toFixed(2)}°`,
          min: -30,
          max: 0,
          minorSplitLine: {
            show: false,
            lineStyle: {
              color: 'lightgray',
              type: 'dotted',
            },
          },
          axisLabel: {
            color: '#e6e1e6',
            formatter: (value: number) => value,
            outside: false,
            align: 'right',
            verticalAlign: 'middle',
            padding: [0, 10, 0, 0],
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },

        // V-Space
        {
          type: 'value',
          gridIndex: 1,
          name: `Normalized Amplitude EL / dB @ AZ = ${((180 * bfAzEl.az) / Math.PI).toFixed(2)}`,
          nameLocation: 'end',
          nameGap: 10,
          min: -30,
          max: 0,
          minorSplitLine: {
            show: false,
            lineStyle: {
              color: 'lightgray',
              type: 'dotted',
            },
          },
          axisLabel: {
            color: '#e6e1e6',
            formatter: (value: number) => value,
            inside: true,
            align: 'right',
            verticalAlign: 'middle',
            padding: [0, 10, 0, 0],
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
      ],
      xAxis: [
        {
          type: 'value',
          axisLabel: {
            inside: false,
            align: 'center',
            verticalAlign: 'middle',
            padding: [10, 10, 10, 10],
            color: '#e6e1e6',
            formatter: degreeFormatter,
          },
          splitNumber: 4,
          min: -90,
          max: 90,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
        // V-Space
        {
          gridIndex: 1,
          type: 'value',
          axisLabel: {
            inside: false,
            align: 'center',
            verticalAlign: 'middle',
            padding: [0, 0, 0, 0], // Optional für Feinanpassung
            color: '#e6e1e6',
            formatter: degreeFormatter,
          },
          splitNumber: 4,
          min: -90,
          max: 90,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444', // Grün für Y-Achse
              width: 1,
              type: 'solid',
            },
          },
        },
      ],
      series: [
        {
          name: 'u',
          type: 'line',
          showSymbol: false,
          lineStyle: {
            color: 'rgba(192, 0, 0, 0.8)',
          },
          data: plotData.map((sample) => [sample.angle, dBFormatter(sample.az / kpis.numElements)]),
          markLine: {
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: {
              color: 'red',
              width: 2,
              type: 'dashed',
            },
            data:
              kpis.az.hpbw !== null && hoveredKpi === 'HpbwAz'
                ? [
                    {
                      grid: 1,
                      xAxis: kpis.az.leftHPBWCrossing,
                    },
                    { xAxis: kpis.az.rightHPBWCrossing },
                  ]
                : kpis.az.fnbw !== null && hoveredKpi === 'FnbwAz'
                  ? [
                      {
                        grid: 1,
                        xAxis: kpis.az.leftZeroCrossing,
                      },
                      { xAxis: kpis.az.rightZeroCrossing },
                    ]
                  : kpis.az.slr !== null && hoveredKpi === 'SlrAz'
                    ? [
                        {
                          grid: 1,
                          yAxis: dBFormatter(kpis.az.sll! / kpis.numElements!),
                        },
                      ]
                    : [],
          },
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(255, 0, 0, 0.1)',
            },
            label: {
              show: false,
            },
            data: [
              kpis.az.hpbw !== null && hoveredKpi === 'HpbwAz'
                ? [
                    {
                      xAxis: kpis.az.leftHPBWCrossing,
                    },
                    { xAxis: kpis.az.rightHPBWCrossing },
                  ]
                : kpis.az.fnbw !== null && hoveredKpi === 'FnbwAz'
                  ? [
                      {
                        grid: 1,
                        xAxis: kpis.az.leftZeroCrossing,
                      },
                      { xAxis: kpis.az.rightZeroCrossing },
                    ]
                  : [
                      {
                        grid: 1,
                        xAxis: 0,
                      },
                      { xAxis: 0 },
                    ],
            ],
          },
        },
        {
          name: 'v',
          xAxisIndex: 1,
          yAxisIndex: 1,
          type: 'line',
          showSymbol: false,
          data: plotData.map((sample) => [sample.angle, dBFormatter(sample.el / kpis.numElements)]),
          markLine: {
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: {
              color: 'rgba(64, 192, 64, 1.0)',
              width: 2,
              type: 'dashed',
            },
            data:
              kpis.el.hpbw !== null && hoveredKpi === 'HpbwEl'
                ? [
                    {
                      grid: 1,
                      xAxis: kpis.el.leftHPBWCrossing,
                    },
                    { xAxis: kpis.el.rightHPBWCrossing },
                  ]
                : kpis.el.fnbw !== null && hoveredKpi === 'FnbwEl'
                  ? [
                      {
                        grid: 1,
                        xAxis: kpis.el.leftZeroCrossing,
                      },
                      { xAxis: kpis.el.rightZeroCrossing },
                    ]
                  : kpis.el.slr !== null && hoveredKpi === 'SlrEl'
                    ? [
                        {
                          grid: 1,
                          yAxis: dBFormatter(kpis.el.sll! / kpis.numElements!),
                        },
                      ]
                    : [],
          },
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(0, 255, 0, 0.1)',
            },
            label: {
              show: false,
            },
            data: [
              kpis.el.hpbw !== null && hoveredKpi === 'HpbwEl'
                ? [
                    {
                      xAxis: kpis.el.leftHPBWCrossing,
                    },
                    { xAxis: kpis.el.rightHPBWCrossing },
                  ]
                : kpis.el.fnbw !== null && hoveredKpi === 'FnbwEl'
                  ? [
                      {
                        grid: 1,
                        xAxis: kpis.el.leftZeroCrossing,
                      },
                      { xAxis: kpis.el.rightZeroCrossing },
                    ]
                  : [
                      {
                        grid: 1,
                        xAxis: 0,
                      },
                      { xAxis: 0 },
                    ],
            ],
          },
        },
      ],
    };
    this.myChart?.setOption(config);
  });

  myChart: echarts.ECharts;
  ngOnInit(): void {
    // Register the required components
    echarts.use([
      TitleComponent,
      TooltipComponent,
      GridComponent,
      DatasetComponent,
      TransformComponent,
      CanvasRenderer,
      LegendComponent,
      LineChart,
      MarkAreaComponent,
      MarkLineComponent,
    ]);

    this.myChart = echarts.init(this.echartDiv().nativeElement);

    const option: ECBasicOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: CallbackDataParams) =>
          `${params.seriesName} <br> ${params.name} : ${params.value ?? '?'}`,
      },
      // legend: {
      //   left: 'left'
      // },
      grid: [
        {
          top: '7%',
          left: '3%',
          right: '3%',
          height: '40%',
          containLabel: true,
        },
        {
          left: '3%',
          right: '3%',
          top: '55%',
          height: '45%',
          containLabel: true,
        },
      ],

      xAxis: [
        {
          type: 'value',
          axisLabel: {
            inside: false,
            align: 'center',
            verticalAlign: 'middle',
            padding: [10, 10, 10, 10],
            color: '#e6e1e6',
            formatter: (value: number) => `${value.toFixed(0)}°`,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
        {
          gridIndex: 1,
          type: 'value',
          axisLabel: {
            inside: false,
            align: 'center',
            verticalAlign: 'middle',
            padding: [0, 0, 0, 0],
            color: '#e6e1e6',
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
      ],

      yAxis: [
        {
          type: 'value',
          name: 'Normalized Amplitude x / dB',
          min: 0.01,
          max: 1.1,
          minorSplitLine: {
            show: true,
            lineStyle: {
              color: 'lightgray',
              type: 'dotted',
            },
          },
          axisLabel: {
            color: '#e6e1e6',
            formatter: (value: number) => (value !== 0 ? `${10 * Math.log10(value / 1)}` : ''),
            inside: true,
            align: 'left',
            verticalAlign: 'middle',
            padding: [0, 10, 0, 0],
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
        {
          type: 'value',
          gridIndex: 1,
          name: 'Normalized Amplitude y / dB',
          nameLocation: 'end',
          nameGap: 10,
          min: 0.01,
          max: 1.1,
          minorSplitLine: {
            show: true,
            lineStyle: {
              color: 'lightgray', // Farbe der kleinen Zwischen-Gitterlinien
              type: 'dotted',
            },
          },
          axisLabel: {
            color: '#e6e1e6',
            formatter: (value: number) => (value !== 0 ? `${10 * Math.log10(value / 1)}` : ''),
            inside: true,
            align: 'left',
            verticalAlign: 'middle',
            padding: [0, 10, 0, 0],
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#444444',
              width: 1,
              type: 'solid',
            },
          },
        },
      ],
      series: [],
      animation: false,
    };

    // Display the chart using the configuration items and data just specified.
    this.myChart.setOption(option);
  }
}
