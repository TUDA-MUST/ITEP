import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BabylonJSViewComponent } from './babylon-jsview.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('BabylonJSViewComponent', () => {
  let component: BabylonJSViewComponent;
  let fixture: ComponentFixture<BabylonJSViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BabylonJSViewComponent],
    });
    fixture = TestBed.createComponent(BabylonJSViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
