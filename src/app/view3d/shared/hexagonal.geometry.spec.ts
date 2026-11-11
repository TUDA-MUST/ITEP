import { describe, expect, it } from 'vitest';
import { apertureHexagon, uvHexagon } from './hexagonal.geometry';
import { subdivideGeometry } from './subdivide.geometry';

describe('hexagonal geometry', () => {
  it('encloses the complete circular aperture with four triangles', () => {
    expect(apertureHexagon.indices.length).toBe(12);
    expect(apertureHexagon.positions.length).toBe(18);
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const x = apertureHexagon.positions[3 * i];
      const y = apertureHexagon.positions[3 * i + 1];
      const dx = apertureHexagon.positions[3 * j] - x;
      const dy = apertureHexagon.positions[3 * j + 1] - y;
      expect((x * dy - y * dx) / Math.hypot(dx, dy)).toBeCloseTo(0.5, 6);
      expect(apertureHexagon.uvs[2 * i]).toBeCloseTo(x + 0.5);
      expect(apertureHexagon.uvs[2 * i + 1]).toBeCloseTo(y + 0.5);
    }
  });

  it.each([1, 2, 5])(
    'subdivides into a continuous equilateral mesh with %i segments',
    (segments) => {
      const mesh = subdivideGeometry(uvHexagon, segments);
      expect(mesh.positions.length / 3).toBe(3 * segments * (segments + 1) + 1);
      expect(mesh.indices.length / 3).toBe(6 * segments * segments);
      const edges = new Map<string, number>();
      let area = 0;
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3));
        const ax = mesh.positions[a * 3];
        const ay = mesh.positions[a * 3 + 1];
        const bx = mesh.positions[b * 3];
        const by = mesh.positions[b * 3 + 1];
        const cx = mesh.positions[c * 3];
        const cy = mesh.positions[c * 3 + 1];
        const signedArea = ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
        expect(signedArea).toBeGreaterThan(0);
        area += signedArea;
        for (const [start, end] of [
          [a, b],
          [b, c],
          [c, a],
        ]) {
          expect(start).toBeLessThan(mesh.positions.length / 3);
          const key = [start, end].sort((a, b) => a - b).join(',');
          edges.set(key, (edges.get(key) ?? 0) + 1);
          expect(
            Math.hypot(
              mesh.positions[start * 3] - mesh.positions[end * 3],
              mesh.positions[start * 3 + 1] - mesh.positions[end * 3 + 1],
            ),
          ).toBeCloseTo(2 / Math.sqrt(3) / segments, 6);
        }
      }
      expect(area).toBeCloseTo(2 * Math.sqrt(3), 6);
      expect([...edges.values()].filter((count) => count === 1).length).toBe(6 * segments);
      expect([...edges.values()].every((count) => count === 1 || count === 2)).toBe(true);
      for (let i = 0; i < mesh.positions.length / 3; i++) {
        expect(mesh.uvs[2 * i]).toBe(mesh.positions[3 * i]);
        expect(mesh.uvs[2 * i + 1]).toBe(mesh.positions[3 * i + 1]);
      }
    },
  );

  it('keeps the production mesh below the previous vertex and triangle counts', () => {
    const mesh = subdivideGeometry(uvHexagon, 216);
    expect(mesh.positions.length / 3).toBe(140617);
    expect(mesh.indices.length / 3).toBe(279936);
    expect(mesh.positions.length / 3).toBeLessThan(402 * 402);
    expect(mesh.indices.length / 3).toBeLessThan(2 * 401 * 401);
  });

  it.each([0, -1, 1.5, NaN])('rejects invalid segment count %s', (segments) => {
    expect(() => subdivideGeometry(uvHexagon, segments)).toThrow(RangeError);
  });
});
