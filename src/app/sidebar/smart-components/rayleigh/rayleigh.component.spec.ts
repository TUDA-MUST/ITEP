import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { RayleighComponent } from './rayleigh.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('RayleighComponent', () => {
  let component: RayleighComponent;
  let fixture: ComponentFixture<RayleighComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RayleighComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RayleighComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
