import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TaperComponent } from './taper.component';

describe('taper editor', () => {
  it('starts tapering at the current uniform SLL and preserves it when switching windows', () => {
    const fixture = TestBed.createComponent(TaperComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const { az, el } = component.store.kpis();
    const expected = Math.max(-80, Math.min(-1, Math.floor(Math.max(az.slr!, el.slr!) * 10) / 10));
    component.form.patchValue({ type: 'taylor' });
    expect(component.store.taper()).toMatchObject({ type: 'taylor', sll: expected });
    component.form.patchValue({ type: 'chebyshev' });
    expect(component.store.taper().sll).toBe(expected);
  });
});
