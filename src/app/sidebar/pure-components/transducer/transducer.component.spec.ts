import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TransducerComponent } from './transducer.component';

import { describe, beforeEach, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

describe('TransducerComponent', () => {
  let component: TransducerComponent;
  let fixture: ComponentFixture<TransducerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransducerComponent],
      providers: [
        provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransducerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
