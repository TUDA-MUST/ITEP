import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BabylonJSViewComponent } from './babylon-jsview.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';


describe('BabylonJSViewComponent', () => {
  let component: BabylonJSViewComponent;
  let fixture: ComponentFixture<BabylonJSViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BabylonJSViewComponent],
      providers: [
        provideZonelessChangeDetection(),
      ]
    });
    fixture = TestBed.createComponent(BabylonJSViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
