import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';
import { ResultAspect } from 'src/app/view3d/materials/rayleigh.material';

export type ResultSet = 'XZPlane' | 'YZPlane' | 'CutCube';

export interface RayleighProbePoint {
  x: number;
  y: number;
  z: number;
}

interface RayleighState {
  aspect: ResultAspect;
  resultSet: ResultSet;
  vectorModeEnabled: boolean;
  probePoint: RayleighProbePoint;
}

export const withRayleigh = () =>
  signalStoreFeature(
    withState<RayleighState>({
      aspect: ResultAspect.Elongation,
      resultSet: 'XZPlane',
      vectorModeEnabled: false,
      probePoint: { x: 0, y: 0, z: 0.5 },
    }),
    withMethods((store) => ({
      setAspect: (aspect: ResultAspect) => {
        patchState(store, { aspect });
      },
      setResultSet: (resultSet: ResultSet) => {
        patchState(store, { resultSet });
      },
      setVectorModeEnabled: (vectorModeEnabled: boolean) => {
        patchState(store, { vectorModeEnabled });
      },
      setProbePoint: (probePoint: RayleighProbePoint) => {
        patchState(store, { probePoint });
      },
    })),
  );
