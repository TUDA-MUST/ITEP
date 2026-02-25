import { type Scene } from '@babylonjs/core/scene';

export const implementsOnSceneCreated = (candidate: unknown): candidate is BabylonConsumer =>
  typeof candidate === 'object' && candidate !== null && 'ngxSceneCreated' in candidate;

export abstract class BabylonConsumer {
  abstract ngxSceneCreated(scene: Scene): Promise<void>;
}
