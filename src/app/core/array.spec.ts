import { describe, expect, test } from 'vitest';
import { transducerPositions } from './array';

describe('Array', () => {
  test('URA element count', () => {
    // For a 4x4 URA, we should have 16 elements
    const uraConfig = {
      type: 'ura',
      elementsX: 4,
      elementsY: 4,
      pitchX: 10,
      pitchY: 10,
    } as const;

    const positions = transducerPositions(uraConfig);
    expect(positions.length).toBe(16);
  });

  test('Hex element count', () => {
    const elements = 7;
    const hexConfig = {
      type: 'hex',
      elements,
      pitch: 10,
      omitCenter: false,
    } as const;

    // Hexagon numbers: 3n^2 - 3n + 1
    const expectedElementCount = 3 * elements ** 2 - 3 * elements + 1;
    const positions = transducerPositions(hexConfig);
    expect(positions.length).toBe(expectedElementCount);
  });
});
