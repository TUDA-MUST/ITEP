import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { FarfieldComponent } from './farfield.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('FarfieldComponent', () => {
  let component: FarfieldComponent;
  let fixture: ComponentFixture<FarfieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarfieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FarfieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
