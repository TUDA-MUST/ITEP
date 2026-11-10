export interface AperturePoint {
  x: number;
  y: number;
}

export interface VoronoiCell {
  /** Coincident elements share one cell; indices refer to the input positions. */
  indices: number[];
  polygon: AperturePoint[];
  area: number;
}

export interface AperturePartition {
  cells: VoronoiCell[];
  message: string | null;
}

const cross = (o: AperturePoint, a: AperturePoint, b: AperturePoint) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function polygonArea(points: readonly AperturePoint[]): number {
  if (points.length < 3) return 0;
  const origin = points[0];
  let twiceArea = 0;
  for (let i = 1; i < points.length - 1; i++) {
    twiceArea += cross(origin, points[i], points[i + 1]);
  }
  return Math.abs(twiceArea) / 2;
}

function convexHull(points: readonly AperturePoint[]): AperturePoint[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const half = (input: AperturePoint[]) => {
    const hull: AperturePoint[] = [];
    for (const p of input) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0)
        hull.pop();
      hull.push(p);
    }
    return hull.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/** Clip a convex polygon to the side of the bisector nearest to site a. */
function clip(polygon: AperturePoint[], a: AperturePoint, b: AperturePoint): AperturePoint[] {
  const nx = b.x - a.x;
  const ny = b.y - a.y;
  const mx = a.x + nx / 2;
  const my = a.y + ny / 2;
  const distance = (p: AperturePoint) => (p.x - mx) * nx + (p.y - my) * ny;
  const result: AperturePoint[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const ds = distance(start);
    const de = distance(end);
    const startInside = ds <= 0;
    const endInside = de <= 0;
    if (startInside) result.push(start);
    if (startInside !== endInside) {
      const t = ds / (ds - de);
      result.push({ x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) });
    }
  }
  return result;
}

/**
 * Coordinates are in metres, areas in square metres. Circular apertures use an
 * inscribed polygon with at least 512 sides (relative area error < 0.003%).
 * Other arrays use the convex hull of their centres, independent of transducer
 * size and display padding.
 * Pairwise half-plane clipping avoids a dependency and supports collinear sites
 * when a circular boundary is available.
 */
export function partitionAperture(
  positions: readonly AperturePoint[],
  diameter: number | null,
): AperturePartition {
  const empty = (message: string): AperturePartition => ({ cells: [], message });
  if (!positions.length) return empty('Add elements to calculate the Voronoi partition.');
  if (positions.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
    return empty('Element positions must be finite.');
  }
  if (diameter !== null && (!Number.isFinite(diameter) || diameter <= 0)) {
    return empty('A positive aperture diameter is needed for the Voronoi partition.');
  }
  const sites: { point: AperturePoint; indices: number[] }[] = [];
  const byPosition = new Map<string, number>();
  positions.forEach((point, index) => {
    const key = `${point.x},${point.y}`;
    const existing = byPosition.get(key);
    if (existing !== undefined) sites[existing].indices.push(index);
    else {
      byPosition.set(key, sites.length);
      sites.push({ point, indices: [index] });
    }
  });
  // Align polygon vertices to regular ring sites so equal ring cells stay equal.
  const sides = sites.length <= 512 ? Math.ceil(512 / sites.length) * sites.length : 512;
  const boundary =
    diameter === null
      ? convexHull(sites.map((s) => s.point))
      : Array.from({ length: sides }, (_, i) => ({
          x: (diameter / 2) * Math.cos((i * 2 * Math.PI) / sides),
          y: (diameter / 2) * Math.sin((i * 2 * Math.PI) / sides),
        }));
  if (polygonArea(boundary) === 0) {
    return empty(
      'The element centres do not enclose an area. A Voronoi area distribution is unavailable.',
    );
  }
  const cells = sites
    .map((site, i) => {
      let polygon = boundary;
      for (let j = 0; j < sites.length && polygon.length; j++) {
        if (i !== j) polygon = clip(polygon, site.point, sites[j].point);
      }
      return { indices: site.indices, polygon, area: polygonArea(polygon) };
    })
    .filter((cell) => cell.area > 0);
  return { cells, message: null };
}

type DiscreteAreaBin = { area: number; areaIndices: number[] };
type AreaRangeBin = { lower: number; upper: number; areaIndices: number[] };

/** Areas use m². Membership refers to indices into the input areas. */
export type AreaBin = DiscreteAreaBin | AreaRangeBin;

function discreteAreaBins(
  areas: readonly number[],
  areaIndices: readonly number[],
  limit: number,
): DiscreteAreaBin[] | null {
  const sortedIndices = [...areaIndices].sort((a, b) => areas[a] - areas[b]);
  const bins: DiscreteAreaBin[] = [];
  for (const index of sortedIndices) {
    const area = areas[index];
    const bin = bins.at(-1);
    // Clipping can introduce tiny differences between geometrically equal cells.
    if (bin && area - bin.area <= area * 1e-9) {
      bin.areaIndices.push(index);
    } else {
      if (bins.length === limit) return null;
      bins.push({ area, areaIndices: [index] });
    }
  }
  return bins;
}

/** Use exact size groups when practical, otherwise use square-root range bins. */
export function areaHistogram(areas: readonly number[]): AreaBin[] {
  const areaIndices: number[] = [];
  let min = Infinity;
  let max = -Infinity;
  areas.forEach((area, index) => {
    if (!Number.isFinite(area) || area <= 0) return;
    areaIndices.push(index);
    min = Math.min(min, area);
    max = Math.max(max, area);
  });
  if (!areaIndices.length) return [];
  const count = Math.min(20, Math.ceil(Math.sqrt(areaIndices.length)));
  const discrete = discreteAreaBins(areas, areaIndices, Math.max(3, count));
  if (discrete) return discrete;
  const width = (max - min) / count;
  const bins: AreaRangeBin[] = Array.from({ length: count }, (_, i) => ({
    lower: min + i * width,
    upper: min + (i + 1) * width,
    areaIndices: [],
  }));
  // Roundoff from polygon clipping can put equal areas on either side of a bin edge.
  // Treat values within floating-point tolerance of an edge as belonging to the upper bin.
  const boundaryTolerance = max * 64 * Number.EPSILON;
  for (const index of areaIndices) {
    const bin = Math.min(count - 1, Math.floor((areas[index] - min + boundaryTolerance) / width));
    bins[bin].areaIndices.push(index);
  }
  return bins;
}
