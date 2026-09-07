import {
  createShaderMaterial,
  setShaderStorageBuffer,
  setShaderTexture,
  type ShaderMaterial,
  type StorageBuffer,
  type Texture2D,
} from '@babylonjs/lite';

import { excitationBufferMaxElements } from '../../utils/excitationbuffer';
import fragmentSource from './shaders/rayleigh.fragment.wgsl';
import vertexSource from './shaders/rayleigh.vertex.wgsl';

export enum LiteResultAspect {
  Elongation = 0,
  Amplitude = 1,
  Phase = 2,
}

export function createRayleighLiteMaterial(
  colormap: Texture2D,
  excitation: StorageBuffer,
): ShaderMaterial {
  const material = createShaderMaterial({
    name: 'RayleighMaterial',
    vertexSource,
    fragmentSource,
    attributes: ['position'],
    uniforms: [
      'worldViewProjection',
      { name: 'globalPhase', type: 'f32', defaultValue: 0 },
      { name: 'k', type: 'f32', defaultValue: 0 },
      { name: 'viewmode', type: 'i32', defaultValue: LiteResultAspect.Elongation },
      { name: 'dynamicRange', type: 'f32', defaultValue: 10 },
      { name: 'elongationColormapY', type: 'f32', defaultValue: 0 },
      { name: 'magnitudeColormapY', type: 'f32', defaultValue: 0 },
      { name: 'phaseColormapY', type: 'f32', defaultValue: 0 },
      { name: 'numElements', type: 'i32', defaultValue: 0 },
    ],
    samplers: ['colormap'],
    storageBuffers: [
      { name: 'excitation', type: `array<ExcitationElement, ${excitationBufferMaxElements}>` },
    ],
    backFaceCulling: false,
  });

  setShaderTexture(material, 'colormap', colormap);
  setShaderStorageBuffer(material, 'excitation', excitation);
  return material;
}
