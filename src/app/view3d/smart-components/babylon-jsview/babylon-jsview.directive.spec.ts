import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BabylonJSViewDirective, shouldUseWebGPUEngine } from './babylon-jsview.directive';

import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import { Component, ChangeDetectionStrategy } from '@angular/core';

beforeAll(() => {
  // Mock ResizeObserver
  // @ts-expect-error "global typing not available"
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

@Component({
  imports: [BabylonJSViewDirective],
  template: `<canvas babylonsjsview></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BabylonCanvasTest {}

describe('BabylonJSViewComponent', () => {
  let component: BabylonCanvasTest;
  let fixture: ComponentFixture<BabylonCanvasTest>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BabylonJSViewDirective],
    });
    fixture = TestBed.createComponent(BabylonCanvasTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable webgpu for firefox on mac', () => {
    expect(
      shouldUseWebGPUEngine(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:146.0) Gecko/20100101 Firefox/146.0',
        'MacIntel',
      ),
    ).toBe(false);
  });

  it('should keep webgpu for firefox on non-mac platforms', () => {
    expect(
      shouldUseWebGPUEngine(
        'Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0',
        'Linux x86_64',
      ),
    ).toBe(true);
  });
});
