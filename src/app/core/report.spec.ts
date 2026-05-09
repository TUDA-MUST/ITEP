import { describe, expect, test } from 'vitest';
import { transducerPositions } from './array';
import { analyzePSF, calcCrossPattern } from './report';
import { calcK, calcLambda } from './environment';
import { rad2deg } from '../utils/degrad';

describe('Report', () => {
  test('URA Metrics', () => {
    const elementsX = 32;
    const elementsY = 4;

    const pitchX = 0.0043;
    const pitchY = 0.0043;

    const uraConfig = {
      type: 'ura',
      elementsX,
      elementsY,
      pitchX,
      pitchY,
    } as const;

    const n = uraConfig.elementsX * uraConfig.elementsY;

    const env = {
      environmentHint: 'Air',
      speedOfSound: 343,
      excitationFrequencyBase: 40,
      excitationFrequencyMultiplier: 'kHz',
    } as const;

    const transducers = transducerPositions(uraConfig);
    const cross = calcCrossPattern(
      transducers,
      { type: 'Point' },
      { beamformingEnabled: false, az: 0, el: 0 },
      calcK(env),
    );
    const report = analyzePSF(cross, n);
    const lambda = calcLambda(env);

    expect.soft(report.az.hpbw).toBe(rad2deg((0.866 * lambda) / (elementsX * pitchX)));
    expect.soft(report.az.fnbw).toBe(rad2deg(4 / elementsX));
    expect.soft(report.az.sll).toBe(-12.26);
  });
});
