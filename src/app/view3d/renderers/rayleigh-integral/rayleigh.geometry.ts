import type { ResultSet } from 'src/app/store/rayleigh.state';

export interface RayleighGeometry {
  positions: Float32Array;
  indices: Uint32Array;
}

const quadIndices = new Uint32Array([0, 1, 2, 1, 3, 2]);
const xzPositions = new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0, 1, 0.5, 0, 1]);
const yzPositions = new Float32Array([0, -0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1]);
const cubePositions = reflectX(
  new Float32Array([
    -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, 0, 0.5, 0, 0, 0, 0, -0.5, 0, 0, -0.5, -0.5, 1, 0.5,
    -0.5, 1, 0.5, 0.5, 1, 0, 0.5, 1, 0, 0, 1, -0.5, 0, 1,
  ]),
);
const cubeIndices = new Uint32Array([
  0, 2, 1, 0, 5, 4, 4, 3, 2, 4, 10, 3, 10, 9, 3, 2, 3, 9, 2, 9, 8, 5, 11, 4, 11, 10, 4, 0, 6, 5, 6,
  11, 5, 0, 1, 6, 1, 7, 6, 1, 2, 7, 2, 8, 7, 6, 8, 7, 6, 11, 10, 10, 9, 8,
]);

const geometries: Record<ResultSet, RayleighGeometry> = {
  XZPlane: { positions: xzPositions, indices: quadIndices },
  YZPlane: { positions: yzPositions, indices: quadIndices },
  CutCube: { positions: cubePositions, indices: cubeIndices },
};

export function rayleighGeometry(resultSet: ResultSet): RayleighGeometry {
  return geometries[resultSet];
}

function reflectX(positions: Float32Array): Float32Array {
  const reflected = positions.slice();
  for (let index = 0; index < reflected.length; index += 3) {
    reflected[index] *= -1;
  }
  return reflected;
}
