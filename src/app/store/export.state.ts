import { signalStoreFeature, withState, withMethods, patchState } from '@ngrx/signals';
import { type HoveredKpi } from '../sidebar/pure-components/kpi/kpi.component';

export interface Point {
  x: number;
  y: number;
}

export enum ResultSpace {
  UV = 'uv',
  AZEL = 'azel',
}

export interface ResultValues {
  u: Point[];
  v: Point[];
}

interface ExportState {
  u: Point[];
  v: Point[];
  resultUnits: ResultSpace;
  hoveredKpi: HoveredKpi;
}

export const withExport = () => signalStoreFeature(
  withState<ExportState>({
    u: [],
    v: [],
    resultUnits: ResultSpace.UV,
    hoveredKpi: '',
  }),
  withMethods((store) => ({
    setResultValues: (values: ResultValues) => {
      patchState(store, { ...values });
    },
    setResultUnit: (unit: ResultSpace) => {
      patchState(store, { resultUnits: unit });
    },
    setHoveredKpi: (hoveredKpi: HoveredKpi) => {
      patchState(store, { hoveredKpi });
    },
  }))
);
