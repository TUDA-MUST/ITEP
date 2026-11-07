import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInstanceByDom } from 'echarts/core';
import { TaperComponent } from './taper.component';

const setup = () => {
  const fixture = TestBed.createComponent(TaperComponent);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    chart: getInstanceByDom(fixture.componentInstance.plot().nativeElement)!,
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('taper editor', () => {
  it('synchronizes numeric input, marker and shared state, and rejects invalid input', () => {
    const { fixture, component, chart } = setup();
    component.form.patchValue({ type: 'taylor', sll: -25 });
    fixture.detectChanges();
    expect(component.store.taper().sll).toBe(-25);
    expect(chart.getOption()['series']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ markLine: expect.objectContaining({ data: [{ yAxis: -25 }] }) }),
      ]),
    );
    component.form.controls.sll.setValue(10);
    expect(component.store.taper().sll).toBe(-25);
    component.store.setTaper({ sll: -40 });
    fixture.detectChanges();
    expect(component.form.controls.sll.value).toBe(-40);
    expect(fixture.nativeElement.textContent).toContain('below the visible range');
  });
  it('updates the numeric input through the native chart drag handler', () => {
    let update: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      update = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { fixture, component, chart } = setup();
    chart.resize({ width: 300, height: 240 });
    component.store.setTaper({ type: 'taylor', sll: -20 });
    fixture.detectChanges();
    const graphics = chart.getOption()['graphic'] as {
      elements: { id: string; ondrag: (this: { y: number }) => void }[];
    }[];
    const handle = graphics[0].elements.find((element) => element.id === 'sll-handle')!;
    const position = chart.convertToPixel({ gridIndex: 0 }, [75, -25]);
    handle.ondrag.call({ y: position[1] });
    update!(0);
    fixture.detectChanges();
    expect(component.store.taper().sll).toBe(-25);
    expect(component.form.controls.sll.value).toBe(-25);
  });
  it('disposes its chart on destruction', () => {
    const { fixture, chart } = setup();
    fixture.destroy();
    expect(chart.isDisposed()).toBe(true);
  });
});
