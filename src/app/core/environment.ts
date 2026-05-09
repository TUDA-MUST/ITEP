export type FrequencyMultiplier = 'Hz' | 'kHz' | 'MHz';

const FrequencyMultiplierValue: Record<FrequencyMultiplier, number> = {
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
};

export const frequencyFromBase = (base: number, multiplier: FrequencyMultiplier) =>
  base * FrequencyMultiplierValue[multiplier];

export type EnvironmentHint = 'Air' | 'Water' | 'Custom';
export interface Environment {
  environmentHint: EnvironmentHint;
  speedOfSound: number;

  excitationFrequencyBase: number;
  excitationFrequencyMultiplier: FrequencyMultiplier; // rename to frequencyMultiplier
}

export const calcK = (environment: Environment) =>
  (2 *
    Math.PI *
    frequencyFromBase(
      environment.excitationFrequencyBase,
      environment.excitationFrequencyMultiplier,
    )) /
  environment.speedOfSound;

export const calcLambda = (environment: Environment) =>
  environment.speedOfSound /
  frequencyFromBase(environment.excitationFrequencyBase, environment.excitationFrequencyMultiplier);
