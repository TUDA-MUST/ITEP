import { computed } from '@angular/core';
import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';

import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { presets } from '../presets';

import { withViewportConfig } from './viewportConfig.state';
import { withSelection } from './selection.state';
import { withRayleigh } from './rayleigh.state';
import { withExport } from './export.state';
import { withBeamforming } from './beamforming.state';

import { analyzePSF, calcCrossPattern } from '../core/report';
import type { TransducerType } from '../core/transducer';
import { transducerPositions, type ArrayGeometry } from '../core/array';
import { calcK, type Environment } from '../core/environment';
import type { Citation } from '../core/citation';

export interface RangeKpi {
  firstZero: number | null;
  secondZero: number | null;
}

export interface ArrayConfig {
  name: string;
  environment: Environment;
  citation: Citation | null;
  config: ArrayGeometry;
  transducerModel: TransducerType;
}

export type ArrayConfigType = ArrayConfig['config']['type'];

export interface Transducer {
  name: string;
  pos: Vector3;
  enabled: boolean;
  selected: boolean;
}

export const StoreService = signalStore(
  { providedIn: 'root' },
  withState<{
    arrayConfig: ArrayConfig;
    globalPhase: number;
  }>({
    arrayConfig: presets[0],
    globalPhase: 0,
  }),
  withBeamforming(),
  withMethods((store) => ({
    setGlobalPhase: (globalPhase: number) => patchState(store, { globalPhase }),
    setConfig: (newConfig: Partial<ArrayConfig>) => {
      patchState(store, { arrayConfig: { ...store.arrayConfig(), ...newConfig } });
    },
    setTransducer: (transducerModel: TransducerType) =>
      patchState(store, {
        arrayConfig: { ...store.arrayConfig(), transducerModel },
      }),
    setEnvironment: (environment: Partial<Environment>) =>
      patchState(store, {
        arrayConfig: {
          ...store.arrayConfig(),
          environment: {
            ...store.arrayConfig().environment,
            ...environment,
            ...(environment.environmentHint === 'Air'
              ? { speedOfSound: 343 }
              : environment.environmentHint === 'Water'
                ? { speedOfSound: 1482 }
                : {}),
          },
        },
      }),
  })),
  withComputed((store) => {
    const k = computed(() => {
      const env = store.arrayConfig().environment;
      return calcK(env);
    });
    const transducers = computed(() => transducerPositions(store.arrayConfig().config));
    const crossPattern = computed(() =>
      calcCrossPattern(
        transducers(),
        store.arrayConfig().transducerModel,
        store.beamforming(),
        k(),
      ),
    );

    const kpis = computed(() => {
      const pattern = crossPattern();
      const result = analyzePSF(pattern, transducers().length);
      return result;
    });

    return { k, transducers, crossPattern, kpis };
  }),
  withViewportConfig(),
  withSelection(),
  withRayleigh(),
  withExport(),
);
