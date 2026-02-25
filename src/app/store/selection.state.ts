import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';

export interface SelectionState {
  hovered: number[];
  selected: number[];
}

export const withSelection = () =>
  signalStoreFeature(
    withState<{ selection: SelectionState }>({
      selection: {
        hovered: [],
        selected: [],
      },
    }),
    withMethods((store) => ({
      setHovered: (transducerId: number) => {
        patchState(store, { selection: { ...store.selection(), hovered: [transducerId] } });
      },
      clearHovered: () => {
        patchState(store, { selection: { ...store.selection(), hovered: [] } });
      },
    })),
  );
