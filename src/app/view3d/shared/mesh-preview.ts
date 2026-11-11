export const wireframePreview = new URLSearchParams(globalThis.location?.search).get('wireframe');

export function triangleEdges(positions: Float32Array, indices: Uint32Array, scale = 1) {
  const points = Array.from({ length: positions.length / 3 }, (_, i) => ({
    x: positions[i * 3] * scale,
    y: positions[i * 3 + 1] * scale,
    z: positions[i * 3 + 2] * scale,
  }));
  const lines: (typeof points)[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < indices.length; i += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const a = indices[i + corner];
      const b = indices[i + ((corner + 1) % 3)];
      const key = Math.min(a, b) * points.length + Math.max(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push([points[a], points[b]]);
    }
  }
  return lines;
}
