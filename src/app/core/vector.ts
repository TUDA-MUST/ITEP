export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export const vector3 = (x: number, y: number, z = 0): Vector3Data => ({ x, y, z });
