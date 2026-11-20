import type { BeamformingState } from '../store/beamforming.state';
import type { Transducer } from '../store/store.service';
import { azElToUV, type UVCoordinates } from '../utils/uv';
import { patternElement, type TransducerType } from './transducer';

import Complex from 'complex.js';

// Code to analyze PSF and extract metrics like HPBW, SLL, etc.

type PSFPoint = {
  angle: number;
  az: Complex;
  el: Complex;
};

type LobeMetrics = {
  leftHPBWCrossing: number | null;
  rightHPBWCrossing: number | null;
  leftZeroCrossing: number | null;
  rightZeroCrossing: number | null;
  hpbw: number | null;
  fnbw: number | null;
  sll: number | null;
  slr: number | null;
  maxl: number | null;
};

export type PSFResult = {
  numElements: number;
  az: LobeMetrics;
  el: LobeMetrics;
};

const range = (start: number, end: number, step = 1) => {
  if (step === 0) throw new Error('Step size cannot be zero');
  return Array.from(
    { length: Math.max(Math.ceil((end - start) / step) + 1, 0) },
    (_, i) => start + i * step,
  );
};

const findMaxIndex = (arr: Complex[]): number =>
  arr.reduce((maxIdx, val, idx, array) => (val.abs() > array[maxIdx].abs() ? idx : maxIdx), 0);

const interpolate = (x1: number, y1: number, x2: number, y2: number, yTarget: number): number =>
  x1 + ((yTarget - y1) * (x2 - x1)) / (y2 - y1);

const findCrossing = (
  x: number[],
  y: number[],
  threshold: number,
  startIdx: number,
  direction: 1 | -1,
): number | null => {
  let i = startIdx;
  while (i >= 0 && i < y.length - 1) {
    const y1 = y[i];
    const y2 = y[i + 1];
    if ((y1 - threshold) * (y2 - threshold) < 0) {
      return interpolate(x[i], y1, x[i + 1], y2, threshold);
    }
    i += direction;
  }
  return null;
};

export const patternUV = (k: number, bf: BeamformingState, transducers: Transducer[]) => {
  const bfuv = azElToUV(bf);
  const sources = transducers.map((t) => ({
    x: k * t.pos.x,
    y: k * t.pos.y,
    phase: bf?.beamformingEnabled ? k * ((bfuv.u ?? 0) * t.pos.x + (bfuv.v ?? 0) * t.pos.y) : 0,
    amplitude: t.amplitude ?? 1,
  }));
  return (uv: UVCoordinates) => {
    let real = 0;
    let imaginary = 0;
    for (const source of sources) {
      const arg = source.x * uv.u + source.y * uv.v - source.phase;
      real += source.amplitude * Math.cos(arg);
      imaginary += source.amplitude * Math.sin(arg);
    }
    return new Complex(real, imaginary);
  };
};

const analyzeOneAxis = (angles: number[], psf: Complex[]): LobeMetrics => {
  if (psf.length === 0 || psf.every((value) => value.abs() === 0)) {
    return {
      leftHPBWCrossing: null,
      rightHPBWCrossing: null,
      leftZeroCrossing: null,
      rightZeroCrossing: null,
      hpbw: null,
      fnbw: null,
      sll: null,
      slr: null,
      maxl: null,
    };
  }
  const maxIdx = findMaxIndex(psf);
  const maxVal = psf[maxIdx];
  const halfPower = maxVal.abs() / Math.sqrt(2);

  const magnitudes = psf.map((c) => c.abs());

  const leftHPBWCrossing = findCrossing(angles, magnitudes, halfPower, maxIdx, -1);
  const rightHPBWCrossing = findCrossing(angles, magnitudes, halfPower, maxIdx, 1);

  // Magnitude minima are invariant under translation of the aperture; zeros
  // of the real part are not. Refine each sampled minimum with a parabola.
  const firstMinimum = (direction: -1 | 1): number | null => {
    for (let i = maxIdx + direction; i > 0 && i < magnitudes.length - 1; i += direction) {
      const left = magnitudes[i - 1] ** 2;
      const mid = magnitudes[i] ** 2;
      const right = magnitudes[i + 1] ** 2;
      if (mid < left && mid <= right) {
        const offset = (0.5 * (left - right)) / (left - 2 * mid + right);
        return angles[i] + offset * (angles[i + 1] - angles[i]);
      }
    }
    return null;
  };
  const leftZeroCrossing = firstMinimum(-1);
  const rightZeroCrossing = firstMinimum(1);

  const hpbw: number | null =
    rightHPBWCrossing !== null && leftHPBWCrossing !== null
      ? rightHPBWCrossing - leftHPBWCrossing
      : null;
  const fnbw: number | null =
    rightZeroCrossing !== null && leftZeroCrossing !== null
      ? rightZeroCrossing - leftZeroCrossing
      : null;

  // FIXME: Use Array.slice
  const sidelobeVals = angles
    .map((angle, i) => ({ angle, val: psf[i] }))
    .filter(({ angle }) =>
      leftZeroCrossing !== null && rightZeroCrossing !== null
        ? angle < leftZeroCrossing || angle > rightZeroCrossing
        : false,
    )
    .map(({ val }) => val.abs());

  const maxSidelobe = sidelobeVals.length > 0 ? Math.max(...sidelobeVals) : null;
  const sll = maxSidelobe !== null ? maxSidelobe : null;
  const slr = sll != null ? 20 * Math.log10(sll / maxVal.abs()) : null;

  return {
    leftHPBWCrossing,
    rightHPBWCrossing,
    leftZeroCrossing,
    rightZeroCrossing,
    hpbw,
    fnbw,
    sll,
    slr,
    maxl: maxVal.abs() !== null ? maxVal.abs() : null,
  };
};

export const calcCrossPattern = (
  transducers: Transducer[],
  transducerModel: TransducerType,
  bf: BeamformingState,
  k: number,
  angleStep = 0.25,
) => {
  const steeringAzEl = bf?.beamformingEnabled ? bf : { az: 0, el: 0 };
  const steeringUV = azElToUV(steeringAzEl);

  const af = patternUV(k, bf, transducers);
  const ef = patternElement(transducerModel, k);

  // Do not cascade multiple computeds!
  return range(-90, 90, angleStep).map((angle) => {
    const rad = (angle * Math.PI) / 180;

    // Amplitude for the az axis
    const u = azElToUV({ az: rad, el: steeringAzEl.el }).u;
    const uarg = { u, v: steeringUV.v };
    const azAF = af(uarg);
    const azEF = ef(uarg);

    const v = azElToUV({ az: steeringAzEl.az, el: rad }).v;
    const varg = { u: steeringUV.u, v };
    const elAF = af(varg);
    const elEF = ef(varg);

    const az = azAF.mul(azEF);
    const el = elAF.mul(elEF);

    return { angle, az, el };
  });
};

export const analyzePSF = (data: PSFPoint[], numElements: number): PSFResult => {
  const angles = data.map((d) => d.angle);
  const azValues = data.map((d) => d.az);
  const elValues = data.map((d) => d.el);

  return {
    numElements,
    az: analyzeOneAxis(angles, azValues),
    el: analyzeOneAxis(angles, elValues),
  };
};
