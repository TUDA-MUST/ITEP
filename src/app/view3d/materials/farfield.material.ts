import { type Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import { excitationBufferMaxElementsDefine } from '../../utils/excitationbuffer';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';
import { type TransducerType } from 'src/app/core/transducer';
import { TextureSampler } from '@babylonjs/core/Materials/Textures/textureSampler';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Constants } from '@babylonjs/core/Engines/constants';
import { type BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { colormapTextureSampleRows } from '../shared/colormap-texture';
import vertexSource from './shaders/farfield.vertex.wgsl';
import fragmentSource from './shaders/farfield.fragment.wgsl';

export class FarfieldMaterial extends ShaderMaterial {
  constructor(scene: Scene, texture: BaseTexture) {
    super(
      'FarfieldMaterial',
      scene,
      {
        vertexSource,
        fragmentSource,
      },
      {
        attributes: ['position', 'normal', 'uv'],
        uniforms: [
          'worldViewProjection',
          'projection',
          'globalPhase',
          'k',
          'ka',
          'kb',
          't',
          'dynamicRange',
          'numElements',
          'transducerType',
          'colormapY',
        ],
        uniformBuffers: ['Scene', 'Mesh', 'excitation'],
        samplers: ['colormapSampler'],
        defines: ['#define INSTANCES', excitationBufferMaxElementsDefine],
        shaderLanguage: ShaderLanguage.WGSL,
      },
    );

    this.backFaceCulling = false;
    this.wireframe = false;

    this.setTexture('colormapTexture', texture);
    this.setFloat('colormapY', colormapTextureSampleRows.viridis);

    const sampler = new TextureSampler();
    sampler.setParameters(Engine.TEXTURE_CLAMP_ADDRESSMODE, Engine.TEXTURE_CLAMP_ADDRESSMODE);
    sampler.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    this.setTextureSampler('colormapSampler', sampler);
  }

  setTransducerModel(model: TransducerType): void {
    switch (model.type) {
      case 'Point':
        this.setInt('transducerType', 0);
        break;
      case 'Piston':
        this.setInt('transducerType', 1);
        break;
      case 'Rectangular':
        this.setInt('transducerType', 2);
        break;
      default:
        console.warn('Unknown transducer model: ', model);
    }
  }
}
