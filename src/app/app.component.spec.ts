import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeAll(() => {
    // Mock ResizeObserver
    // @ts-expect-error "global typing not available"
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
