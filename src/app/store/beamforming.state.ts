import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';

export interface UVCoordinates {
  u: number;
  v: number;
}

export interface AzElCoordinates {
  az: number;
  el: number;
}

type _NullPartial<T> = {
  [K in keyof T]?: T[K] | null;
};

export interface BeamformingState extends AzElCoordinates {
  beamformingEnabled: boolean;
}

export const withBeamforming = () =>
  signalStoreFeature(
    withState<{ beamforming: BeamformingState }>({
      beamforming: {
        beamformingEnabled: false,
        az: 0,
        el: 0,
      },
    }),
    withMethods((store) => ({
      setBeamforming: (beamforming: BeamformingState) => {
        patchState(store, { beamforming });
      },
      reset: () => {
        patchState(store, { beamforming: { ...store.beamforming(), az: 0, el: 0 } });
      },
      setEnabled: (beamformingEnabled: boolean) => {
        patchState(store, { beamforming: { ...store.beamforming(), beamformingEnabled } });
      },
      setPartial: (partialState: Partial<BeamformingState>) => {
        patchState(store, { beamforming: { ...store.beamforming(), ...partialState } });
      },
      resetBeamforming: () => {
        patchState(store, { beamforming: { ...store.beamforming(), az: 0, el: 0 } });
      },
    })),
  );
