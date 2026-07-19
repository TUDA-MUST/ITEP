import type { Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Engine } from '@babylonjs/core/Engines/engine';
import { excitationBufferMaxElementsDefine } from '../../utils/excitationbuffer';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';

import { TextureSampler } from '@babylonjs/core/Materials/Textures/textureSampler';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { colormapTextureSampleRows } from '../shared/colormap-texture';
import vertexSource from './shaders/rayleigh.vertex.wgsl';
import fragmentSource from './shaders/rayleigh.fragment.wgsl';

// Do not make type since integers are needed for shader uniforms
export enum ResultAspect {
  Elongation = 0,
  Amplitude = 1,
  Phase = 2,
}

export class RayleighMaterial extends ShaderMaterial {
  constructor(scene: Scene, texture: BaseTexture) {
    super(
      'RayleighMaterial',
      scene,
      {
        vertexSource,
        fragmentSource,
      },
      {
        attributes: ['position', 'normal', 'uv'],
        uniforms: [
          'worldViewProjection',
          'globalPhase',
          'k',
          'omega',
          'viewmode',
          'dynamicRange',
          'elongationColormapY',
          'magnitudeColormapY',
          'phaseColormapY',
          'numElements',
        ],
        uniformBuffers: ['Scene', 'Mesh', 'excitation'],
        samplers: ['colormapSampler'],
        defines: ['#define INSTANCES', excitationBufferMaxElementsDefine],
        shaderLanguage: ShaderLanguage.WGSL,
      },
    );
    this.backFaceCulling = false;

    this.setTexture('colormapTexture', texture);
    this.setFloat('elongationColormapY', colormapTextureSampleRows.coolwarm);
    this.setFloat('magnitudeColormapY', colormapTextureSampleRows.viridis);
    this.setFloat('phaseColormapY', colormapTextureSampleRows.twilightShifted);
    const sampler = new TextureSampler();

    sampler.setParameters(Engine.TEXTURE_CLAMP_ADDRESSMODE, Engine.TEXTURE_CLAMP_ADDRESSMODE); // use the default values
    sampler.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    this.setTextureSampler('colormapSampler', sampler);
  }

  public setResultAspect(aspect: ResultAspect | null): void {
    if (aspect !== null) {
      this.setInt('viewmode', aspect);
    }
  }
}
