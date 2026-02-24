import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';

export enum Results {
    Farfield,
    RayleighIntegral
}

export const withViewportConfig = () => signalStoreFeature(
  withState({
    enabledResults: [Results.Farfield],
  }),
  withMethods((store) => ({
    setResultVisible: (result: Results, visible: boolean) => {
      const results = new Set(store.enabledResults());
      if (visible) {
        results.add(result);
      } else {
        results.delete(result);
      }
      patchState(store, { enabledResults: [...results] });
    },
  })),
);