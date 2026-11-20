import { computed } from '@angular/core';
import { signalStore, withMethods, withState, patchState, withComputed } from '@ngrx/signals';

import { defaultTaper, taperWeights, validTaper, type TaperConfig } from '../core/taper';
import { presets } from '../presets';
import type { Vector3Data } from '../core/vector';

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
  taper?: TaperConfig;
  environment: Environment;
  citation: Citation | null;
  config: ArrayGeometry;
  transducerModel: TransducerType;
}

export type ArrayConfigType = ArrayConfig['config']['type'];

export interface Transducer {
  amplitude?: number;
  name: string;
  pos: Vector3Data;
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
    loadConfig: (arrayConfig: ArrayConfig) => patchState(store, { arrayConfig }),
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
    const geometry = computed(() => store.arrayConfig().config);
    const positions = computed(() => transducerPositions(geometry()));
    const uniformKpis = computed(() => {
      const pattern = calcCrossPattern(
        positions(),
        store.arrayConfig().transducerModel,
        store.beamforming(),
        k(),
      );
      return analyzePSF(pattern, positions().length);
    });
    const uniformSll = computed(() => {
      const { az, el } = uniformKpis();
      const levels = [az.slr, el.slr].filter(
        (level): level is number => level !== null && Number.isFinite(level),
      );
      return levels.length
        ? Math.max(-80, Math.min(-1, Math.floor(Math.max(...levels) * 10) / 10))
        : -1;
    });
    const taper = computed(() => {
      const config = store.arrayConfig().taper ?? defaultTaper(geometry());
      return config.type !== 'uniform' && !config.allowHigherSidelobes
        ? { ...config, sll: Math.min(config.sll, uniformSll()) }
        : config;
    });
    const transducers = computed(() => {
      const elements = positions();
      const weights = taperWeights(elements, geometry(), taper());
      return elements.map((element, i) => ({ ...element, amplitude: weights[i] }));
    });
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

    return { k, taper, uniformSll, transducers, crossPattern, kpis };
  }),
  withMethods((store) => ({
    setTaper: (update: Partial<TaperConfig>) => {
      const taper = { ...store.taper(), ...update };
      if (!validTaper(taper)) return;
      if (taper.type !== 'uniform' && !taper.allowHigherSidelobes) {
        taper.sll = Math.min(taper.sll, store.uniformSll());
      }
      patchState(store, { arrayConfig: { ...store.arrayConfig(), taper } });
    },
  })),
  withViewportConfig(),
  withSelection(),
  withRayleigh(),
  withExport(),
);
