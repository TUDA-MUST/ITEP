import { createShaderMaterial, type ShaderMaterial } from '@babylonjs/lite';

import fragmentSource from './shaders/transducer.fragment.wgsl';
import vertexSource from './shaders/transducer.vertex.wgsl';

export function createTransducerLiteMaterial(): ShaderMaterial {
  return createShaderMaterial({
    name: 'TransducerMaterial',
    vertexSource,
    fragmentSource,
    attributes: ['position', 'uv', 'color'],
    useThinInstanceColors: true,
    uniforms: [
      'worldViewProjection',
      { name: 'globalPhase', type: 'f32', defaultValue: 0 },
      { name: 'transducerType', type: 'f32', defaultValue: 0 },
    ],
    needAlphaBlending: true,
    backFaceCulling: false,
    depthCompare: 'always',
  });
}
