import { type Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import type { TransducerType } from 'src/app/core/transducer';

import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage';
import vertexSource from './shaders/transducer.vertex.wgsl';
import fragmentSource from './shaders/transducer.fragment.wgsl';

export class TransducerMaterial extends ShaderMaterial {
  constructor(scene: Scene) {
    super(
      'TransducerMaterial',
      scene,
      {
        vertexSource,
        fragmentSource,
      },
      {
        attributes: ['position', 'uv', 'selected'],
        uniforms: [],
        uniformBuffers: ['Scene', 'Mesh'],
        needAlphaBlending: true,
        shaderLanguage: ShaderLanguage.WGSL,
      },
    );
    this.backFaceCulling = false;
    this.setFloat('transducerType', 0);
  }

  setTransducerModel(model: TransducerType): void {
    switch (model.type) {
      case 'Point':
      case 'Piston':
        this.setFloat('transducerType', 0);
        break;
      case 'Rectangular':
        this.setFloat('transducerType', 1);
        break;
    }
  }
}
