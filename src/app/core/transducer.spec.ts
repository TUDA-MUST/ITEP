import { describe, expect, test } from 'vitest';
import { patternElement } from './transducer';

describe('transducer patternElement', () => {
  test('returns 1 at boresight for rectangular transducer', () => {
    const ef = patternElement({ type: 'Rectangular', width: 0.01, height: 0.02 }, 1000);
    expect(ef({ u: 0, v: 0 })).toBe(1);
  });

  test('uses sinc product behavior for rectangular transducer', () => {
    const k = 1000;
    const width = 0.01;
    const ef = patternElement({ type: 'Rectangular', width, height: 0.02 }, k);
    const uFirstZero = (2 * Math.PI) / (k * width);

    expect(Math.abs(ef({ u: uFirstZero, v: 0 }))).toBeLessThan(1e-12);
  });
});
