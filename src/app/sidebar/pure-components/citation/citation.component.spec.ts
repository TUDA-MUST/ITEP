import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CitationComponent } from './citation.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('CitationComponent', () => {
  let component: CitationComponent;
  let fixture: ComponentFixture<CitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitationComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
