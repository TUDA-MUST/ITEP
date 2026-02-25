import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrayConfigComponent } from './array-config.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('ArrayConfigComponent', () => {
  let component: ArrayConfigComponent;
  let fixture: ComponentFixture<ArrayConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArrayConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArrayConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
