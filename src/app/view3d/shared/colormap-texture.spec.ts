import { describe, expect, it } from 'vitest';
import {
  colormapTextureRowCount,
  colormapTextureRows,
  colormapTextureSampleRows,
  colormapTextureSampleY,
} from './colormap-texture';

describe('colormap texture atlas metadata', () => {
  it('keeps the three palettes in a fixed order', () => {
    expect(colormapTextureRowCount).toBe(3);
    expect(colormapTextureRows).toEqual({
      viridis: 0,
      coolwarm: 1,
      twilightShifted: 2,
    });
  });

  it('uses the center of each stacked palette row for sampling', () => {
    expect(colormapTextureSampleRows.viridis).toBeCloseTo(1 / 6);
    expect(colormapTextureSampleRows.coolwarm).toBeCloseTo(1 / 2);
    expect(colormapTextureSampleRows.twilightShifted).toBeCloseTo(5 / 6);
  });

  it('maps every row center into the texture bounds', () => {
    for (let row = 0; row < colormapTextureRowCount; row += 1) {
      const y = colormapTextureSampleY(row);

      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });
});
