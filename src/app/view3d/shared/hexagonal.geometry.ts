// Circumscribe the unit disk: the horizontal edges lie at y = +/-1.
const r = 1 / Math.sqrt(3);
const perimeter = [2 * r, 0, 0, r, 1, 0, -r, 1, 0, -2 * r, 0, 0, -r, -1, 0, r, -1, 0];

// Six perimeter vertices, four triangles; the shader masks the circular aperture.
export const apertureHexagon = {
  positions: new Float32Array(perimeter.map((value) => value / 2)),
  uvs: new Float32Array(
    perimeter.filter((_, index) => index % 3 !== 2).map((value) => value / 2 + 0.5),
  ),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]),
};

// Six equilateral sectors, including the origin as a sampling vertex.
export const uvHexagon = {
  positions: new Float32Array([...perimeter, 0, 0, 0]),
  uvs: new Float32Array([...perimeter.filter((_, index) => index % 3 !== 2), 0, 0]),
  indices: new Uint32Array([6, 0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0]),
};
