import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcitationComponent } from './excitation.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ExcitationComponent', () => {
  let component: ExcitationComponent;
  let fixture: ComponentFixture<ExcitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcitationComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExcitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
