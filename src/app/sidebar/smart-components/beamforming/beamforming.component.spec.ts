import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { BeamformingComponent } from './beamforming.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('BeamformingComponent', () => {
  let component: BeamformingComponent;
  let fixture: ComponentFixture<BeamformingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeamformingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BeamformingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
