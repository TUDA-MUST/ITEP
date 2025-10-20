import { computed } from '@angular/core';
import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { presets } from '../presets';

import { withViewportConfig } from './viewportConfig.state';
import { withSelection } from './selection.state';
import { withRayleigh } from './rayleigh.state';
import { withExport } from './export.state';
import { UVCoordinates, withBeamforming } from './beamforming.state';
import { azElToUV } from '../utils/uv';

import j1 from '@stdlib/math-base-special-besselj1';

export type TransducerModel = 'Point' | 'Piston';

export type Nullable<T> = { [K in keyof T]: T[K] | null };

////
        
type PSFPoint = {
  angle: number;
  az: number;
  el: number;
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

const findMaxIndex = (arr: number[]): number =>
  arr.reduce((maxIdx, val, idx, array) => (val > array[maxIdx] ? idx : maxIdx), 0);

const interpolate = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  yTarget: number
): number => x1 + ((yTarget - y1) * (x2 - x1)) / (y2 - y1);

const findCrossing = (
  x: number[],
  y: number[],
  threshold: number,
  startIdx: number,
  direction: 1 | -1
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

const analyzeOneAxis = (angles: number[], psf: number[], numElements: number): LobeMetrics => {
  const maxIdx = findMaxIndex(psf);
  const maxVal = psf[maxIdx];
  const halfPower = maxVal / Math.sqrt(2);

  const leftHPBWCrossing = findCrossing(angles, psf, halfPower, maxIdx, -1);
  const rightHPBWCrossing = findCrossing(angles, psf, halfPower, maxIdx, 1);

  const leftZeroCrossing = findCrossing(angles, psf, 0, maxIdx, -1);
  const rightZeroCrossing = findCrossing(angles, psf, 0, maxIdx, 1);

  const hpbw: number | null = rightHPBWCrossing !== null && leftHPBWCrossing !== null ? rightHPBWCrossing - leftHPBWCrossing : null;
  const fnbw: number | null = rightZeroCrossing !== null && leftZeroCrossing !== null ? rightZeroCrossing - leftZeroCrossing : null;

  // FIXME: Use Array.slice
  const sidelobeVals = angles
    .map((angle, i) => ({ angle, val: psf[i] }))
    .filter(({ angle }) =>
      leftZeroCrossing !== null && rightZeroCrossing !== null ? angle < leftZeroCrossing || angle > rightZeroCrossing : false
    )
    .map(({ val }) => Math.abs(val));

  const maxSidelobe = sidelobeVals.length > 0 ? Math.max(...sidelobeVals) : null;
  const sll = maxSidelobe !== null ? maxSidelobe : null;
  const slr = sll != null ? 20*Math.log10(sll! / numElements!) : null;

  return {
    leftHPBWCrossing,
    rightHPBWCrossing,
    leftZeroCrossing,
    rightZeroCrossing,
    hpbw,
    fnbw,
    sll,
    slr,
    maxl: maxVal !== null ? maxVal : null
  };
};

export const analyzePSF = (data: PSFPoint[], numElements: number): PSFResult => {
  const angles = data.map(d => d.angle);
  const azValues = data.map(d => d.az);
  const elValues = data.map(d => d.el);

  return {
    numElements,
    az: analyzeOneAxis(angles, azValues, numElements),
    el: analyzeOneAxis(angles, elValues, numElements),
  };
};

const range = (start :number, end : number, step = 1) => {
  if (step === 0) throw new Error("Step size cannot be zero");
  return Array.from(
      { length: Math.max(Math.ceil((end - start) / step)+1, 0) },
      (_, i) => start + i * step
  );
};

export interface RangeKpi {
  firstZero: number | null;
  secondZero: number | null;
}

export type Kind = 'Academic' | 'Industrial';

export interface Citation {
  kind: Kind;
  title: string;
  authors: string;
  year: number;
  url: string;
  urlTitle: string;
}

export interface CircularConfig {
  type: 'circular';
  diameter: number;
  elementCount: number;
}

export type FrequencyMultiplier = 'Hz' | 'kHz' | 'MHz';

const FrequencyMultiplierValue : Record<FrequencyMultiplier, number> = {
  'Hz': 1,
  'kHz': 1e3,
  'MHz': 1e6
};

export const frequencyFromBase = (base : number, multiplier : FrequencyMultiplier) => base * FrequencyMultiplierValue[multiplier];

export type EnvironmentHint = 'Air' | 'Water' | 'Custom';
export interface Environment {
  environmentHint: EnvironmentHint;
  speedOfSound: number;

  excitationFrequencyBase: number;
  excitationFrequencyMultiplier: FrequencyMultiplier; // rename to frequencyMultiplier
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

export interface ArrayConfig {
  name: string;
  environment: Environment;
  citation: Citation | null;
  config: UraConfig | HexagonalConfig | CircularConfig | SpiralConfig;
  transducerModel: TransducerModel;
  transducerDiameter: number;
}

export interface Transducer {
  name: string;
  pos: Vector3;
  enabled: boolean;
  selected: boolean;
}

const uraPositions = (uraConfig : UraConfig) => {
    const { elementsX, elementsY, pitchX, pitchY} = uraConfig;

    // Should be named step-size
    const sizeXH = (elementsX - 1) * pitchX / 2.0;
    const sizeYH = (elementsY - 1) * pitchY / 2.0;

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
          selected: false
        });
      }
    }
    return excitation;
}

const hexagonalPositions = (hexagonalConfig: HexagonalConfig) => {
  const { pitch, elements, omitCenter } = hexagonalConfig;

  if (!Number.isFinite(pitch) || pitch <= 0) {
    console.warn("pitch muss > 0 sein.");
    return [];
  }
  if (!Number.isInteger(elements) || elements < 1) {
    console.warn("elements muss eine ganze Zahl ≥ 1 sein.");
    return [];
  }

  // In axialen Koordinaten ist der "Radius" k = elements - 1.
  const k = elements - 1;

  const points: { name: string; pos: Vector3,  enabled: boolean, selected: boolean }[] = [];

  // Alle axialen Koordinaten (q,r) mit max(|q|,|r|,|s|) <= k, s=-q-r
  for (let q = -k; q <= k; q++) {
    const rMin = Math.max(-k, -q - k);
    const rMax = Math.min(k, -q + k);
    for (let r = rMin; r <= rMax; r++) {
      const s = -q - r;

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
          selected: false
        });
      }
  }

  return points;
}

const spiralPositions = (spiralConfig: SpiralConfig) =>
    Array.from(Array(spiralConfig.elementCount).keys()).map(i => {
      const arrayIndex = (i + (spiralConfig.startWithZero ? 0 : 1));
      const radius = spiralConfig.diameter/2 * Math.sqrt(arrayIndex / spiralConfig.elementCount);
      const phi = 2 * Math.PI * arrayIndex * (1 + Math.sqrt(5)) / 2;
      return {
        name: `Transducer ${arrayIndex}`,
        pos: new Vector3(Math.cos(phi), Math.sin(phi)).scale(radius),
        enabled: false,
        selected: false
      }
    });
  
const circularPositions = (circularConfig : CircularConfig) =>
Array.from(Array(circularConfig.elementCount).keys()).map(i => {
    const phi = i * 2 * Math.PI / circularConfig.elementCount;
    return {
    name: `Transducer ${i}`,
    pos: new Vector3(Math.cos(phi), Math.sin(phi)).scale(circularConfig.diameter / 2),
    enabled: false,
    selected: false
    }
});

export const StoreService = signalStore(
    { providedIn: 'root' },
  withState<{
    arrayConfig: ArrayConfig, 
    globalPhase: number
  }>({
    arrayConfig: presets[0], 
    globalPhase: 0
  }),
  withBeamforming(),
  withMethods((store) => ({
    setGlobalPhase: (globalPhase : number) => patchState(store, { globalPhase }),
    setConfig: (newConfig: ArrayConfig) => {
      patchState(store, { arrayConfig: { ...store.arrayConfig(),  ...newConfig} });
    },
    setTransducerDiameter: (diameter: number | null) => patchState(store, {
        arrayConfig: { ...store.arrayConfig(),  transducerDiameter: diameter ?? store.arrayConfig().transducerDiameter},
    }),
    setTransducer: (transducer: {
      transducerDiameter?: number,
      transducerModel?: TransducerModel
    }) => patchState(store, {
        arrayConfig: { ...store.arrayConfig(), ...transducer }
    }),
    setEnvironment: (environment: Partial<Environment>) => patchState(store, { 
        arrayConfig:{
          ...store.arrayConfig(),
          environment: {
            ...store.arrayConfig().environment,
            ...environment,
          },
        }})
    })),
  withComputed((store) => {
    const k = computed(() => {
        const env = store.arrayConfig().environment;
        return 2 * Math.PI * frequencyFromBase(env.excitationFrequencyBase, env.excitationFrequencyMultiplier) / env.speedOfSound
    });
    const transducers = computed(() => {
        const arrayConfig = store.arrayConfig().config;    
        switch (arrayConfig.type) {
            case 'ura':
                return uraPositions(arrayConfig)
            case 'spiral':
                return spiralPositions(arrayConfig);
            case 'circular':
                return circularPositions(arrayConfig);
            case 'hex':
                return hexagonalPositions(arrayConfig);
            default:
                return [];
        }
    });
    
    const patternU = computed(() => 
        (u : number) => transducers().reduce((acc, t) => {
            const argv = { x: t.pos.x * u, y: t.pos.y * 0 };
            //float argument = k*(argv.x+argv.y) + element.delay*omega;
            const argument = k() * (argv.x+argv.y) //+ element.phasor.x;
            return acc + Math.cos(argument) 
    },0));

    const patternV = computed(() => 
        (v : number) => transducers().reduce((acc, t) => {
            const argv = { x: t.pos.x * 0, y: t.pos.y * v };
            //float argument = k*(argv.x+argv.y) + element.delay*omega;
            const argument = k() * (argv.x+argv.y) //+ element.phasor.x;
            return acc + Math.cos(argument) 
    },0));

    const patternUV = computed(() => {        
        const kk = k();
        const bf = store.beamforming();
        const bfuv = azElToUV(bf);

          return (uv: UVCoordinates) => transducers().reduce((acc, t) => {
            const phase = bf?.beamformingEnabled ? (kk ?? 700) * ((bfuv.u ?? 0) * t.pos.x + (bfuv.v ?? 0) * t.pos.y) : 0;
            const argv = { x: t.pos.x * uv.u, y: t.pos.y * uv.v };
            //float argument = k*(argv.x+argv.y) + element.delay*omega;
            const argument = kk * (argv.x + argv.y) - phase;
            return acc + Math.cos(argument);
        }, 0);
      }
    );

    const patternElement = computed(() => {
      const model = store.arrayConfig.transducerModel();
      switch (model) {
        case "Point":
          return (uv: UVCoordinates) => 1;
        case "Piston":
          const kl = k();
          const a = store.arrayConfig.transducerDiameter() / 2;

          return (uv: UVCoordinates) => {
            const s = Math.hypot(uv.u, uv.v);         // s = sin(theta)
            if (!isFinite(s) || !isFinite(kl) || !isFinite(a)) return NaN;

            const sClamped = Math.min(Math.max(s, 0), 1);

            const x = kl * a * sClamped;
            // Grenzfall x→0 stabilisieren: 2*J1(x)/x → 1 (weil J1(x) ~ x/2)
            if (Math.abs(x) < 1e-8) return 1;

            return (2 * j1(x)) / x;
          }
          default: 
            console.error("Unknown transducer model: ", model);
            return (uv: UVCoordinates) => 0;
        }        
    });

    const derivativeU = computed(() =>  (u : number) =>
        // Sum up over all transducers at particular position x
        transducers().reduce((acc, t) => {
            const argv = { x: t.pos.x * u, y: t.pos.y * 0 };
            //float argument = k*(argv.x+argv.y) + element.delay*omega;
            const argument = k() * (argv.x+argv.y) //+ element.phasor.x;

            // We need the derivative of the argument of sin.
            // As the argument is t.pos.x * x, the derivative is t.pos.x
            const factor = t.pos.x;
            const addVal = -factor*k()*Math.sin(argument);
            const newVal = acc + addVal;
            return newVal;
        }, 0)
    );

    const derivativeV = computed(() =>  (v : number) =>
    // Sum up over all transducers at particular position x
        transducers().reduce((acc, t) => {
            const argv = { x: t.pos.x * 0, y: t.pos.y * v};
            //float argument = k*(argv.x+argv.y) + element.delay*omega;
            const argument = k() * (argv.x+argv.y) //+ element.phasor.x;

            // We need the derivative of the argument of sin.
            // As the argument is t.pos.x * x, the derivative is t.pos.x
            const factor = t.pos.y;
            const addVal = -factor*k()*Math.sin(argument);
            const newVal = acc + addVal;
            return newVal;
        }, 0)
    );

    const samplePatternU = computed(() => range(-1, 1, 2 / 180).map((u) => ({x: u, y: Math.abs(patternU()(u)) / transducers().length})));
    const samplePatternV = computed(() => range(-1, 1, 0.001).map((v) => ({x: v, y: Math.abs(patternV()(v)) / transducers().length})));

    const crossPattern = computed(() => range(-90, 90, 1).map((angle) => {
      const bf = store.beamforming();
      const rad = angle * Math.PI / 180;

      const steeringAzEl = bf?.beamformingEnabled ? bf : { az: 0, el: 0 };
      const steeringUV = azElToUV(steeringAzEl);
      // Evaluate the pattern along two lines
      // In here, we evalue exactly one data point
      
      // Evaluate in AZ direction.
      // 

      const af = patternUV();
      const ef = patternElement();

      const u = azElToUV({ az: rad, el: steeringAzEl.el}).u;
      // Amplitude for the az axis
      const uarg = {u, v: steeringUV.v}
      const azAF = af(uarg);
      const azEF = ef(uarg);

      const az = azAF * azEF;

      const v = azElToUV({ az: steeringAzEl.az, el: rad}).v;
      const varg = {u: steeringUV.u, v};
      const elAF = af(varg);
      const elEF = ef(varg);
      const el = elAF * elEF;
      return { angle, az, el };
    }));


    const lowTechKPis = computed(() => {
      const pattern = crossPattern();
      const result = analyzePSF(pattern, transducers().length);
      return result;
    });


    // const fnbwU = computed(() => {
    //     const firstZero = newtonMethod(patternU(), derivativeU(), 0 - 0.001, 1e-7, 100);
    //     const secondZero = newtonMethod(patternU(), derivativeU(), 0 + 0.001, 1e-7, 100);
    //     console.log("FNBW: firstZero: ", firstZero, " secondZero: ", secondZero);
    //     return { firstZero, secondZero };
    // });

    // const fnbwV = computed(() => {
    //     const firstZero = newtonMethod(patternV(), derivativeV(), 0 - 0.001, 1e-7, 100);
    //     const secondZero = newtonMethod(patternV(), derivativeV(), 0 + 0.001, 1e-7, 100);
    //     console.log("FNBW: firstZero: ", firstZero, " secondZero: ", secondZero);
    //     return { firstZero, secondZero };
    // });

    // const hpbwU = computed(() => {
    //     const max = patternU()(0);
    //     const hbpwfactor = 1.0 / Math.sqrt(2);
    //     const ff = (x : number) => patternU()(x) - ((hbpwfactor) * max);
    //     const firstZero = newtonMethod(ff, derivativeU(), 0 - 0.001, 1e-7, 100);
    //     const secondZero = newtonMethod(ff, derivativeU(), 0 + 0.001, 1e-7, 100);
    //     console.log("HPBW: firstZero: ", firstZero, " secondZero: ", secondZero);
    //     return { firstZero, secondZero };
    // });

    // const hpbwV = computed(() => {
    //     const max = patternV()(0);
    //     const hbpwfactor = 1.0 / Math.sqrt(2);
    //     const ff = (x : number) => patternV()(x) - ((hbpwfactor) * max);
    //     const firstZero = newtonMethod(ff, derivativeV(), 0 - 0.001, 1e-7, 100);
    //     const secondZero = newtonMethod(ff, derivativeV(), 0 + 0.001, 1e-7, 100);
    //     console.log("HPBW: firstZero: ", firstZero, " secondZero: ", secondZero);
    //     return { firstZero, secondZero };
    // });

    return { k, transducers, patternU, patternV, derivativeU, derivativeV, 
             samplePatternU, samplePatternV,
             crossPattern, lowTechKPis };
  }),
  withViewportConfig(),
  withSelection(),
  withRayleigh(),
  withExport(),
);