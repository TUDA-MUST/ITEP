import { describe, expect, it } from 'vitest';
import { defaultTaper, taperWeights, taperWindow, type TaperConfig } from './taper';
import { transducerPositions, type ArrayGeometry } from './array';
import references from './taper-reference.json';

const geometry = { type: 'ura', elementsX: 16, elementsY: 8, pitchX: 1, pitchY: 1 } as const;
const config: TaperConfig = { ...defaultTaper(geometry), type: 'taylor' };

describe('taper windows', () => {
  // Generated independently with scipy.signal.windows; sampled peak normalized.
  for (const reference of references) {
    it(`matches SciPy ${reference.type}, N=${reference.length}, SLL=${reference.sll}`, () => {
      const actual = taperWindow(reference.length, {
        ...config,
        type: reference.type as TaperConfig['type'],
        sll: reference.sll,
      });
      actual.forEach((weight, index) => expect(weight).toBeCloseTo(reference.weights[index], 10));
    });
  }
  it('rejects invalid values and handles empty windows', () => {
    expect(taperWindow(0, config)).toEqual([]);
    for (const change of [{ sll: NaN }, { sll: 30 }, { nbar: 2.5 }, { nbar: 11 }]) {
      expect(() => taperWindow(5, { ...config, ...change })).toThrow();
    }
  });
  it('produces finite symmetric nonnegative windows throughout supported parameter bounds', () => {
    for (const nbar of [2, 4, 10])
      for (const sll of [-15, -30, -80]) {
        const window = taperWindow(129, { ...config, nbar, sll });
        window.forEach((w, i) => {
          expect(Number.isFinite(w)).toBe(true);
          expect(w).toBeGreaterThanOrEqual(0);
          expect(w).toBeCloseTo(window[128 - i], 12);
        });
      }
  });
});

describe('spatial taper mapping', () => {
  it('uses a separable grid window', () => {
    const weights = taperWeights(transducerPositions(geometry), geometry, config);
    const x = taperWindow(16, config),
      y = taperWindow(8, config);
    weights.forEach((w, i) => expect(w).toBeCloseTo(x[i % 16] * y[Math.floor(i / 16)], 12));
  });
  for (const geometry of [
    { type: 'spiral', diameter: 10, elementCount: 32, startWithZero: true },
    { type: 'hex', pitch: 1, elements: 4, omitCenter: false },
    {
      type: 'free',
      positions: [
        { x: 0, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 0 },
        { x: 2, y: 1 },
      ],
    },
  ] as ArrayGeometry[])
    for (const strategy of ['rectangular', 'radial'] as const) {
      it(`is independent of ordering for ${geometry.type}/${strategy}`, () => {
        const elements = transducerPositions(geometry);
        const weights = taperWeights(elements, geometry, { ...config, strategy });
        expect(taperWeights([...elements].reverse(), geometry, { ...config, strategy })).toEqual(
          [...weights].reverse(),
        );
        expect(Math.max(...weights)).toBe(1);
        expect(Math.min(...weights)).toBeLessThan(1);
      });
    }
  it('preserves equal weights on even and odd circular rings', () => {
    for (const elementCount of [7, 8]) {
      const ring = { type: 'circular', diameter: 10, elementCount } as const;
      taperWeights(transducerPositions(ring), ring, { ...config, strategy: 'radial' }).forEach(
        (w) => expect(w).toBeCloseTo(1, 10),
      );
    }
  });
  it('handles zero-width, empty and single-element apertures', () => {
    for (const count of [0, 1, 5]) {
      const line = { ...geometry, elementsX: 1, elementsY: count };
      const weights = taperWeights(transducerPositions(line), line, config);
      expect(weights).toHaveLength(count);
      weights.forEach((w) => expect(Number.isFinite(w)).toBe(true));
    }
  });
  it('is translation invariant for imported positions', () => {
    const free = {
      type: 'free',
      positions: [
        { x: -2, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ],
    } as const;
    const shape: ArrayGeometry = { ...free, positions: [...free.positions] };
    for (const strategy of ['rectangular', 'radial'] as const) {
      const elements = transducerPositions(shape);
      const shifted = elements.map((t) => ({
        ...t,
        pos: { ...t.pos, x: t.pos.x + 50, y: t.pos.y - 12 },
      }));
      expect(taperWeights(shifted, shape, { ...config, strategy })).toEqual(
        taperWeights(elements, shape, { ...config, strategy }),
      );
    }
  });
});
