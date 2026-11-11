import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartComponent, buildHighlightOptions } from './chart.component';
import type { PSFResult } from 'src/app/core/report';
import { getInstanceByDom } from 'echarts/core';

import { describe, beforeEach, it, expect } from 'vitest';

describe('ChartComponent', () => {
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes both plots with consistent axes and data', () => {
    expect(component).toBeTruthy();
    const chart = getInstanceByDom(component.echartDiv().nativeElement)!;
    expect(chart.getOption()).toMatchObject({
      xAxis: [
        { min: -90, max: 90 },
        { min: -90, max: 90 },
      ],
      yAxis: [
        { min: -30, max: 0 },
        { min: -30, max: 0 },
      ],
      series: [
        { id: 'az', data: expect.any(Array) },
        { id: 'el', data: expect.any(Array) },
      ],
    });
    expect(chart.getOption()['series']).toEqual([
      expect.objectContaining({ data: expect.arrayContaining([expect.any(Array)]) }),
      expect.objectContaining({ data: expect.arrayContaining([expect.any(Array)]) }),
    ]);
  });

  it('clears markers through ECharts partial updates', () => {
    const chart = getInstanceByDom(component.echartDiv().nativeElement)!;
    chart.setOption({
      series: [{ id: 'az', ...buildHighlightOptions('az', 'HpbwAz', makeKpis()) }],
    });
    expect(chart.getOption()['series']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'az',
          markArea: expect.objectContaining({ data: [[{ xAxis: -3 }, { xAxis: 4 }]] }),
        }),
      ]),
    );
    chart.setOption({ series: [{ id: 'az', ...buildHighlightOptions('az', '', makeKpis()) }] });
    expect(chart.getOption()['series']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'az',
          markLine: expect.objectContaining({ data: [] }),
          markArea: expect.objectContaining({ data: [] }),
        }),
      ]),
    );
  });

  it('updates both plot ranges', () => {
    const chart = getInstanceByDom(component.echartDiv().nativeElement)!;
    fixture.componentRef.setInput('dynamicRange', 60);
    fixture.detectChanges();
    expect(chart.getOption()['yAxis']).toMatchObject([
      { min: -60, max: 0 },
      { min: -60, max: 0 },
    ]);

    fixture.componentRef.setInput('dynamicRange', 30);
    fixture.detectChanges();
    expect(chart.getOption()['yAxis']).toMatchObject([{ min: -30 }, { min: -30 }]);
  });

  it('disposes the chart when destroyed', () => {
    const chart = getInstanceByDom(component.echartDiv().nativeElement)!;
    fixture.destroy();
    expect(chart.isDisposed()).toBe(true);
  });
});

const makeKpis = (): PSFResult => {
  const metrics = {
    leftHPBWCrossing: -3,
    rightHPBWCrossing: 4,
    leftZeroCrossing: -8,
    rightZeroCrossing: 9,
    hpbw: 7,
    fnbw: 17,
    sll: 2,
    slr: 0.2,
    maxl: 10,
  };
  return { numElements: 10, az: { ...metrics }, el: { ...metrics } };
};

describe('chart highlights', () => {
  for (const [plane, suffix, otherSuffix] of [
    ['az', 'Az', 'El'],
    ['el', 'El', 'Az'],
  ] as const) {
    it(`shows ${plane} half-power and first-null bands`, () => {
      for (const [metric, left, right] of [
        ['Hpbw', -3, 4],
        ['Fnbw', -8, 9],
      ] as const) {
        expect(buildHighlightOptions(plane, `${metric}${suffix}`, makeKpis())).toEqual({
          markLine: { data: [{ xAxis: left }, { xAxis: right }] },
          markArea: { data: [[{ xAxis: left }, { xAxis: right }]] },
        });
      }
    });

    it(`shows the normalized ${plane} sidelobe level without a band`, () => {
      expect(buildHighlightOptions(plane, `Slr${suffix}`, makeKpis())).toEqual({
        markLine: { data: [{ yAxis: 20 * Math.log10(0.2) }] },
        markArea: { data: [] },
      });
    });

    it(`clears ${plane} markers for no hover or the other plane`, () => {
      for (const hover of [
        '',
        `Hpbw${otherSuffix}`,
        `Fnbw${otherSuffix}`,
        `Slr${otherSuffix}`,
      ] as const) {
        expect(buildHighlightOptions(plane, hover, makeKpis())).toEqual({
          markLine: { data: [] },
          markArea: { data: [] },
        });
      }
    });

    it(`omits ${plane} bands with missing crossings`, () => {
      const kpis = makeKpis();
      kpis[plane].leftHPBWCrossing = null;
      kpis[plane].rightZeroCrossing = null;
      for (const hover of [`Hpbw${suffix}`, `Fnbw${suffix}`] as const) {
        expect(buildHighlightOptions(plane, hover, kpis)).toEqual({
          markLine: { data: [] },
          markArea: { data: [] },
        });
      }
    });

    it(`omits ${plane} sidelobe markers when the level is unavailable`, () => {
      const kpis = makeKpis();
      kpis[plane].sll = null;
      expect(buildHighlightOptions(plane, `Slr${suffix}`, kpis)).toEqual({
        markLine: { data: [] },
        markArea: { data: [] },
      });
    });
  }
});
