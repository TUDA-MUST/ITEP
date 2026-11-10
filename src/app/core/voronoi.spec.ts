import { describe, expect, it } from 'vitest';
import { areaHistogram, partitionAperture } from './voronoi';
import { transducerPositions } from './array';

const square = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

describe('aperture partition', () => {
  it('clips a square grid to the hull and counts coincident sites once', () => {
    const { cells } = partitionAperture([...square, square[0]], null);
    expect(cells.map((cell) => cell.area)).toEqual([1, 1, 1, 1]);
    expect(cells[0].indices).toEqual([0, 4]);
    const bins = areaHistogram(cells.map((cell) => cell.area));
    expect(bins).toHaveLength(1);
    expect(bins[0].areaIndices).toEqual([0, 1, 2, 3]);
    expect(bins[0]).toHaveProperty('area', 1);
  });

  it('covers an asymmetric hull without losing or duplicating area', () => {
    const { cells } = partitionAperture([...square, { x: 0.7, y: 1.3 }], null);
    expect(cells).toHaveLength(5);
    expect(cells.every((cell) => cell.area > 0)).toBe(true);
    expect(cells.reduce((area, cell) => area + cell.area, 0)).toBeCloseTo(4, 12);
  });

  it('preserves the circular aperture area within the stated tolerance', () => {
    const positions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    const { cells } = partitionAperture(positions, 2);
    expect(cells).toHaveLength(2);
    expect(cells[0].area).toBeCloseTo(cells[1].area, 12);
    expect(Math.abs(cells[0].area + cells[1].area - Math.PI) / Math.PI).toBeLessThan(0.00003);
    expect(partitionAperture([positions[0]], 2).cells[0].area).toBeCloseTo(Math.PI, 3);
  });

  it('keeps symmetric ring cells in one histogram bin', () => {
    const ring = Array.from({ length: 7 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 7;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    });
    expect(areaHistogram(partitionAperture(ring, 2).cells.map((cell) => cell.area))).toHaveLength(
      1,
    );
  });

  it('explains an empty or zero-area aperture', () => {
    for (const positions of [
      [],
      [square[0]],
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
    ]) {
      const { cells, message } = partitionAperture(positions, null);
      expect(cells).toHaveLength(0);
      expect(message).toBeTruthy();
    }
    expect(partitionAperture(square, 0).cells).toHaveLength(0);
  });
});

it('preserves input indices for each bin, including the maximum area', () => {
  const bins = areaHistogram([1, 0, 1, 2, 3, 4, NaN, 5]);
  expect(bins.map((bin) => bin.areaIndices)).toEqual([[0, 2, 3], [4], [5, 7]]);
  expect(bins.at(-1)).toHaveProperty('upper', 5);
});

it('shows the 6×5 array as three discrete areas without empty bins', () => {
  const transducers = transducerPositions({
    type: 'ura',
    elementsX: 6,
    elementsY: 5,
    pitchX: 0.00385,
    pitchY: 0.00385,
  });
  const { cells } = partitionAperture(
    transducers.map(({ pos }) => pos),
    null,
  );
  const bins = areaHistogram(cells.map(({ area }) => area));
  expect(bins.map(({ areaIndices }) => areaIndices.length)).toEqual([4, 14, 12]);
  const areas = bins.map((bin) => ('area' in bin ? bin.area * 1e6 : NaN));
  expect(areas[0]).toBeCloseTo(3.705625, 6);
  expect(areas[1]).toBeCloseTo(7.41125, 6);
  expect(areas[2]).toBeCloseTo(14.8225, 6);
});
