import {
  createShaderMaterial,
  setShaderStorageBuffer,
  setShaderTexture,
  type ShaderMaterial,
  type StorageBuffer,
  type Texture2D,
} from '@babylonjs/lite';

import { excitationBufferMaxElements } from '../../utils/excitationbuffer';
import fragmentSource from './shaders/farfield.fragment.wgsl';
import vertexSource from './shaders/farfield.vertex.wgsl';

export function createFarfieldLiteMaterial(
  colormap: Texture2D,
  excitation: StorageBuffer,
): ShaderMaterial {
  const material = createShaderMaterial({
    name: 'FarfieldMaterial',
    vertexSource,
    fragmentSource,
    attributes: ['position', 'uv'],
    uniforms: [
      'worldViewProjection',
      { name: 'k', type: 'f32', defaultValue: 0 },
      { name: 'ka', type: 'f32', defaultValue: 0 },
      { name: 'kb', type: 'f32', defaultValue: 0 },
      { name: 'dynamicRange', type: 'f32', defaultValue: 50 },
      { name: 'numElements', type: 'i32', defaultValue: 0 },
      { name: 'transducerType', type: 'i32', defaultValue: 0 },
      { name: 'colormapY', type: 'f32', defaultValue: 0 },
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
