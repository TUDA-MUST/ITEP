import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryContainerComponent } from './library-container.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

describe('LibraryContainerComponent', () => {
  let component: LibraryContainerComponent;
  let fixture: ComponentFixture<LibraryContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryContainerComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LibraryContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
