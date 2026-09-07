import { createShaderMaterial, type ShaderMaterial } from '@babylonjs/lite';

import fragmentSource from './shaders/rayleigh-probe.fragment.wgsl';
import vertexSource from './shaders/rayleigh-probe.vertex.wgsl';

export function createRayleighProbeMaterial(): ShaderMaterial {
  return createShaderMaterial({
    name: 'RayleighProbeMaterial',
    attributes: ['position'],
    uniforms: ['worldViewProjection'],
    vertexSource,
    fragmentSource,
  });
}
