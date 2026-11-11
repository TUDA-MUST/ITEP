interface Geometry {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

/** Split each triangle edge into equal segments, sharing vertices on source edges. */
export function subdivideGeometry(source: Geometry, segments: number): Geometry {
  if (!Number.isInteger(segments) || segments < 1) {
    throw new RangeError('segments must be a positive integer');
  }
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices = new Uint32Array(source.indices.length * segments * segments);
  const boundaryVertices = new Map<string, number>();
  let nextIndex = 0;

  for (let face = 0; face < source.indices.length; face += 3) {
    const corners = Array.from(source.indices.subarray(face, face + 3));
    const rows: number[][] = [];
    for (let i = 0; i <= segments; i++) {
      const row: number[] = [];
      rows.push(row);
      for (let j = 0; j <= segments - i; j++) {
        const weights = [segments - i - j, i, j];
        // Integer weights and source indices identify shared vertices exactly,
        // independent of the direction in which adjacent faces traverse an edge.
        const boundaryKey = weights.includes(0)
          ? corners
              .map((corner, k) => [corner, weights[k]])
              .filter(([, weight]) => weight > 0)
              .sort(([a], [b]) => a - b)
              .map(([corner, weight]) => `${corner}:${weight}`)
              .join(',')
          : undefined;
        let vertex = boundaryKey === undefined ? undefined : boundaryVertices.get(boundaryKey);
        if (vertex === undefined) {
          vertex = positions.length / 3;
          for (let axis = 0; axis < 3; axis++) {
            positions.push(
              corners.reduce(
                (sum, corner, k) =>
                  sum + (source.positions[corner * 3 + axis] * weights[k]) / segments,
                0,
              ),
            );
          }
          for (let axis = 0; axis < 2; axis++) {
            uvs.push(
              corners.reduce(
                (sum, corner, k) => sum + (source.uvs[corner * 2 + axis] * weights[k]) / segments,
                0,
              ),
            );
          }
          if (boundaryKey !== undefined) boundaryVertices.set(boundaryKey, vertex);
        }
        row.push(vertex);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments - i; j++) {
        indices.set([rows[i][j], rows[i + 1][j], rows[i][j + 1]], nextIndex);
        nextIndex += 3;
        if (j < segments - i - 1) {
          indices.set([rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]], nextIndex);
          nextIndex += 3;
        }
      }
    }
  }
  return { positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices };
}
