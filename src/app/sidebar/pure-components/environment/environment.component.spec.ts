import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentComponent } from './environment.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('EnvironmentComponent', () => {
  let component: EnvironmentComponent;
  let fixture: ComponentFixture<EnvironmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvironmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnvironmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
