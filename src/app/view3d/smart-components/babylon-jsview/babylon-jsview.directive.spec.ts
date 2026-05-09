import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BabylonJSViewDirective } from './babylon-jsview.directive';

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
});
