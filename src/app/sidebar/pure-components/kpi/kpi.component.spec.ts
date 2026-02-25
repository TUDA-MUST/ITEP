import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIComponent } from './kpi.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('KPIComponent', () => {
  let component: KPIComponent;
  let fixture: ComponentFixture<KPIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KPIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
