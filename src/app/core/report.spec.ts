import { describe, expect, test } from 'vitest';
import { transducerPositions } from './array';
import { analyzePSF, calcCrossPattern, patternUV } from './report';
import { defaultTaper, taperWeights, type TaperConfig } from './taper';

const geometry = { type: 'ura', elementsX: 32, elementsY: 4, pitchX: 0.5, pitchY: 0.5 } as const;
const bf = { beamformingEnabled: false, az: 0, el: 0 };
const elements = transducerPositions(geometry);
const report = (transducers = elements) =>
  analyzePSF(calcCrossPattern(transducers, { type: 'Point' }, bf, 2 * Math.PI), transducers.length);

describe('weighted radiation pattern', () => {
  test('uniform excitation retains the expected array metrics', () => {
    const result = report();
    expect(result.az.hpbw).toBeCloseTo(3.17, 1);
    expect(result.az.fnbw).toBeCloseTo(7.17, 1);
    expect(result.az.slr).toBeCloseTo(-13.23, 1);
    expect(result.az.maxl).toBe(elements.length);
    expect(patternUV(2 * Math.PI, bf, elements)({ u: 0, v: 0 }).abs()).toBe(elements.length);
  });
  for (const type of ['taylor', 'chebyshev'] as const) {
    test(`${type} suppresses sidelobes and broadens the beam`, () => {
      const config: TaperConfig = { ...defaultTaper(geometry), type };
      const weights = taperWeights(elements, geometry, config);
      const weighted = elements.map((t, i) => ({ ...t, amplitude: weights[i] }));
      const result = report(weighted);
      expect(result.az.slr).toBeCloseTo(-30, 0);
      expect(result.az.hpbw!).toBeGreaterThan(report().az.hpbw!);
      expect(result.az.maxl).toBeCloseTo(
        weights.reduce((a, b) => a + b, 0),
        10,
      );
      const shifted = weighted.map((t) => ({
        ...t,
        pos: { ...t.pos, x: t.pos.x + 3, y: t.pos.y + 7 },
      }));
      expect(report(shifted).az.slr).toBeCloseTo(result.az.slr!, 8);
      const scaled = weighted.map((t) => ({ ...t, amplitude: t.amplitude * 0.1 }));
      expect(report(scaled).az.slr).toBeCloseTo(result.az.slr!, 8);
    });
  }
  test('steering retains weighted coherent amplitude at the requested direction', () => {
    const steering = { beamformingEnabled: true, az: Math.PI / 6, el: 0 };
    const weights = taperWeights(elements, geometry, { ...defaultTaper(geometry), type: 'taylor' });
    const weighted = elements.map((t, i) => ({ ...t, amplitude: weights[i] }));
    const amplitude = patternUV(2 * Math.PI, steering, weighted)({ u: 0.5, v: 0 }).abs();
    expect(amplitude).toBeCloseTo(
      weights.reduce((a, b) => a + b, 0),
      10,
    );
  });

  test('empty and single-element patterns have no sidelobe metric', () => {
    expect(report([]).az.slr).toBeNull();
    expect(report(elements.slice(0, 1)).az.slr).toBeNull();
  });
});
