// Code to calculate element positions

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Point } from '../store/export.state';
import type { Transducer } from '../store/store.service';

export interface CircularConfig {
  type: 'circular';
  diameter: number;
  elementCount: number;
}
export interface SpiralConfig {
  type: 'spiral';
  diameter: number;
  elementCount: number;
  startWithZero: boolean;
}

export interface UraConfig {
  type: 'ura';
  elementsX: number;
  elementsY: number;
  pitchX: number;
  pitchY: number;
}

export interface HexagonalConfig {
  type: 'hex';
  pitch: number;
  elements: number;
  omitCenter: boolean;
}

export interface FreeConfig {
  type: 'free';
  positions: Point[];
}

export type ArrayGeometry =
  | CircularConfig
  | SpiralConfig
  | UraConfig
  | HexagonalConfig
  | FreeConfig;

const uraPositions = (uraConfig: UraConfig) => {
  const { elementsX, elementsY, pitchX, pitchY } = uraConfig;

  // Should be named step-size
  const sizeXH = ((elementsX - 1) * pitchX) / 2.0;
  const sizeYH = ((elementsY - 1) * pitchY) / 2.0;

  const excitation: Transducer[] = [];

  // Use reduce or map?
  for (let y = 0; y < elementsY; y++) {
    for (let x = 0; x < elementsX; x++) {
      const xpos = -sizeXH + x * pitchX;
      const ypos = -sizeYH + y * pitchY;
      excitation.push({
        name: `Transducer ${y * elementsY + x}`,
        pos: new Vector3(xpos, ypos),
        enabled: false,
        selected: false,
      });
    }
  }
  return excitation;
};

const hexagonalPositions = (hexagonalConfig: HexagonalConfig) => {
  const { pitch, elements, omitCenter } = hexagonalConfig;

  if (!Number.isFinite(pitch) || pitch <= 0) {
    console.warn('pitch muss > 0 sein.');
    return [];
  }
  if (!Number.isInteger(elements) || elements < 1) {
    console.warn('elements muss eine ganze Zahl ≥ 1 sein.');
    return [];
  }

  // In axialen Koordinaten ist der "Radius" k = elements - 1.
  const k = elements - 1;

  const points: { name: string; pos: Vector3; enabled: boolean; selected: boolean }[] = [];

  // Alle axialen Koordinaten (q,r) mit max(|q|,|r|,|s|) <= k, s=-q-r
  for (let q = -k; q <= k; q++) {
    const rMin = Math.max(-k, -q - k);
    const rMax = Math.min(k, -q + k);
    for (let r = rMin; r <= rMax; r++) {
      const _s = -q - r;

      // Zentrum ggf. weglassen
      if (omitCenter && q === 0 && r === 0) continue;

      // Axial -> kartesisch.
      // Basisvektoren so gewählt, dass der Nachbarabstand exakt "pitch" ist:
      // e1 = (pitch, 0), e2 = (pitch/2, pitch*sqrt(3)/2)
      const x = pitch * (q + r / 2);
      const y = pitch * (Math.sqrt(3) / 2) * r;

      points.push({
        name: `Transducer ${points.length}`,
        pos: new Vector3(x, y),
        enabled: false,
        selected: false,
      });
    }
  }

  return points;
};

const spiralPositions = (spiralConfig: SpiralConfig) =>
  Array.from(Array(spiralConfig.elementCount).keys()).map((i) => {
    const arrayIndex = i + (spiralConfig.startWithZero ? 0 : 1);
    const radius = (spiralConfig.diameter / 2) * Math.sqrt(arrayIndex / spiralConfig.elementCount);
    const phi = (2 * Math.PI * arrayIndex * (1 + Math.sqrt(5))) / 2;
    return {
      name: `Transducer ${arrayIndex}`,
      pos: new Vector3(Math.cos(phi), Math.sin(phi)).scale(radius),
      enabled: false,
      selected: false,
    };
  });

const circularPositions = (circularConfig: CircularConfig) =>
  Array.from(Array(circularConfig.elementCount).keys()).map((i) => {
    const phi = (i * 2 * Math.PI) / circularConfig.elementCount;
    return {
      name: `Transducer ${i}`,
      pos: new Vector3(Math.cos(phi), Math.sin(phi)).scale(circularConfig.diameter / 2),
      enabled: false,
      selected: false,
    };
  });

export const transducerPositions = (arrayGeometry: ArrayGeometry) => {
  switch (arrayGeometry.type) {
    case 'ura':
      return uraPositions(arrayGeometry);
    case 'spiral':
      return spiralPositions(arrayGeometry);
    case 'circular':
      return circularPositions(arrayGeometry);
    case 'hex':
      return hexagonalPositions(arrayGeometry);
    case 'free':
      return arrayGeometry.positions.map((e, idx) => ({
        name: `Transducer ${idx}`,
        pos: new Vector3(e.x, e.y, 0),
        enabled: false,
        selected: false,
      }));
    default:
      return [];
  }
};
