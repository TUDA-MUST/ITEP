import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StoreService } from './store.service';
import { presets } from '../presets';

describe('taper state', () => {
  it('preserves explicit taper settings on geometry edits and resets on loading a legacy preset', () => {
    const store = TestBed.inject(StoreService);
    store.setTaper({ type: 'taylor', strategy: 'rectangular', sll: -40 });
    store.setConfig({ config: { type: 'hex', pitch: 1, elements: 3, omitCenter: false } });
    expect(store.taper()).toMatchObject({ type: 'taylor', strategy: 'rectangular', sll: -40 });
    expect(store.transducers().some((t) => t.amplitude < 1)).toBe(true);
    store.loadConfig(presets[0]);
    expect(store.taper().type).toBe('uniform');
    expect(store.transducers().every((t) => t.amplitude === 1)).toBe(true);
  });
  it('rejects invalid settings without contaminating derived amplitudes', () => {
    const store = TestBed.inject(StoreService);
    const initial = store.taper();
    store.setTaper({ sll: NaN });
    store.setTaper({ nbar: 3.5 });
    expect(store.taper()).toEqual(initial);
  });
});
