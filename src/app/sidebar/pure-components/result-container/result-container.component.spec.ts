import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultContainerComponent } from './result-container.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ResultContainerComponent', () => {
  let component: ResultContainerComponent;
  let fixture: ComponentFixture<ResultContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultContainerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
