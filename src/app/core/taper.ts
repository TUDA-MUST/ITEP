import type { ArrayGeometry } from './array';
import type { Transducer } from '../store/store.service';

export interface TaperConfig {
  type: 'uniform' | 'taylor' | 'chebyshev';
  strategy: 'rectangular' | 'radial';
  sll: number;
  nbar: number;
}

export const defaultTaper = (geometry: ArrayGeometry): TaperConfig => ({
  type: 'uniform',
  strategy: geometry.type === 'ura' || geometry.type === 'free' ? 'rectangular' : 'radial',
  sll: -30,
  nbar: 4,
});

export function validTaper(config: TaperConfig): boolean {
  return (
    ['uniform', 'taylor', 'chebyshev'].includes(config.type) &&
    ['rectangular', 'radial'].includes(config.strategy) &&
    Number.isFinite(config.sll) &&
    config.sll >= -80 &&
    config.sll <= -15 &&
    Number.isInteger(config.nbar) &&
    config.nbar >= 2 &&
    config.nbar <= 10
  );
}

const normalize = (weights: number[]): number[] => {
  const peak = Math.max(...weights);
  return peak > 0 ? weights.map((w) => w / peak) : weights.map(() => 1);
};

/** Symmetric windows; normalization is to the largest sampled element. */
export function taperWindow(length: number, config: TaperConfig): number[] {
  if (!Number.isInteger(length) || length < 0 || !validTaper(config)) {
    throw new RangeError('Invalid taper parameters');
  }
  if (length < 2 || config.type === 'uniform') return Array(length).fill(1);
  const attenuation = -config.sll;
  if (config.type === 'taylor') {
    const a = Math.acosh(10 ** (attenuation / 20)) / Math.PI;
    const scale = config.nbar ** 2 / (a * a + (config.nbar - 0.5) ** 2);
    const coefficients = Array.from({ length: config.nbar - 1 }, (_, index) => {
      const m = index + 1;
      let numerator = (-1) ** (m + 1);
      let denominator = 2;
      for (let j = 1; j < config.nbar; j++) {
        numerator *= 1 - (m * m) / (scale * (a * a + (j - 0.5) ** 2));
        if (j !== m) denominator *= 1 - (m * m) / (j * j);
      }
      return numerator / denominator;
    });
    return normalize(
      Array.from(
        { length },
        (_, i) =>
          1 +
          2 *
            coefficients.reduce(
              (sum, f, m) =>
                sum + f * Math.cos((2 * Math.PI * (m + 1) * (i - (length - 1) / 2)) / length),
              0,
            ),
      ),
    );
  }

  // Invert the sampled Chebyshev frequency response using a real DFT.
  // This avoids polynomial expansion, which is unstable at higher orders.
  const order = length - 1;
  const beta = Math.cosh(Math.acosh(10 ** (attenuation / 20)) / order);
  const spectrum = Array.from({ length }, (_, k) => {
    const x = beta * Math.cos((Math.PI * k) / length);
    return Math.abs(x) <= 1
      ? Math.cos(order * Math.acos(x))
      : (x < -1 ? (-1) ** order : 1) * Math.cosh(order * Math.acosh(Math.abs(x)));
  });
  return normalize(
    Array.from({ length }, (_, i) => {
      const offset = Math.abs(i - order / 2);
      return spectrum.reduce(
        (sum, p, k) => sum + p * Math.cos((2 * Math.PI * k * offset) / length),
        0,
      );
    }),
  );
}

/** Linear interpolation in a spatial profile, never in element-list order. */
function sample(window: number[], coordinate: number): number {
  const position = Math.max(0, Math.min(1, coordinate)) * (window.length - 1);
  const low = Math.floor(position);
  const fraction = position - low;
  return window[low] * (1 - fraction) + window[Math.min(low + 1, window.length - 1)] * fraction;
}

export function taperWeights(
  transducers: Transducer[],
  geometry: ArrayGeometry,
  config: TaperConfig,
): number[] {
  if (!validTaper(config)) throw new RangeError('Invalid taper parameters');
  if (transducers.length < 2 || config.type === 'uniform') return transducers.map(() => 1);
  const xs = transducers.map((t) => t.pos.x);
  const ys = transducers.map((t) => t.pos.y);
  const xmin = Math.min(...xs),
    xmax = Math.max(...xs);
  const ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  // Generated geometries are centered at the origin, including odd-sided rings.
  const cx = geometry.type === 'free' ? (xmin + xmax) / 2 : 0;
  const cy = geometry.type === 'free' ? (ymin + ymax) / 2 : 0;
  if (config.strategy === 'radial') {
    const radii = transducers.map((t) => Math.hypot(t.pos.x - cx, t.pos.y - cy));
    const radius = Math.max(...radii);
    if (radius === 0) return transducers.map(() => 1);
    const profile = taperWindow(129, config);
    return normalize(radii.map((r) => sample(profile, (1 + r / radius) / 2)));
  }
  const wx = taperWindow(geometry.type === 'ura' ? geometry.elementsX : 129, config);
  const wy = taperWindow(geometry.type === 'ura' ? geometry.elementsY : 129, config);
  return normalize(
    transducers.map(
      (t) =>
        (xmax === xmin ? 1 : sample(wx, (t.pos.x - xmin) / (xmax - xmin))) *
        (ymax === ymin ? 1 : sample(wy, (t.pos.y - ymin) / (ymax - ymin))),
    ),
  );
}
