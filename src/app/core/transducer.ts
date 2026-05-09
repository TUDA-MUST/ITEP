import j1 from '@stdlib/math-base-special-besselj1';
import type { UVCoordinates } from '../utils/uv';

export interface PointTransducer {
  type: 'Point';
}

export interface PistonTransducer {
  type: 'Piston';
  diameter: number;
}

export type TransducerType = PointTransducer | PistonTransducer;
export type TransducerModel = TransducerType['type'];

export const patternElement = (model: TransducerType, k: number) => {
  switch (model.type) {
    case 'Point':
      return (_uv: UVCoordinates) => 1;
    case 'Piston': {
      const a = model.diameter / 2;

      return (uv: UVCoordinates) => {
        const s = Math.hypot(uv.u, uv.v); // s = sin(theta)
        if ([s, k, a].some((num) => !Number.isFinite(num))) return NaN;
        const sClamped = Math.min(Math.max(s, 0), 1);

        const x = k * a * sClamped;
        // Grenzfall x→0 stabilisieren: 2*J1(x)/x → 1 (weil J1(x) ~ x/2)
        if (Math.abs(x) < 1e-8) return 1;

        return (2 * j1(x)) / x;
      };
    }
    default:
      console.error('Unknown transducer model: ', model);
      return (_uv: UVCoordinates) => 0;
  }
};
