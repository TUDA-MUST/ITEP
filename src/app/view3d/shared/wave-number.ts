import type { Environment } from 'src/app/core/environment';
import { frequencyFromBase } from 'src/app/core/environment';

export function waveNumber(environment: Environment): number {
  const frequency = frequencyFromBase(
    environment.excitationFrequencyBase,
    environment.excitationFrequencyMultiplier,
  );
  return (2 * Math.PI * frequency) / environment.speedOfSound;
}
