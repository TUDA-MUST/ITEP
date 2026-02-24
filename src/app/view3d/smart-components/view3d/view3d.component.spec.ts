import { ComponentFixture, TestBed } from '@angular/core/testing';

import { View3dComponent } from './view3d.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('View3dComponent', () => {
  let component: View3dComponent;
  let fixture: ComponentFixture<View3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ View3dComponent ],
      providers: [
        provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(View3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
