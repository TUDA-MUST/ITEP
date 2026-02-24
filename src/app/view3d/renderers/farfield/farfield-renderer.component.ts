import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
} from '@angular/core';

import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';
import { FarfieldMaterial } from '../../materials/farfield.material';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Textures, TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import { Engine } from '@babylonjs/core/Engines/engine';
import { TextureSampler } from '@babylonjs/core/Materials/Textures/textureSampler';
import { Constants } from '@babylonjs/core/Engines/constants';
import { Environment, frequencyFromBase, Transducer} from 'src/app/store/store.service';

const uvMesh: VertexData = (() => {
  const positions = [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0];
  const uv = [-1, -1, 1, -1, -1, 1, 1, 1];
  const indices = [0, 1, 2, 1, 3, 2];
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uv;
  return vertexData;
})();

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-farfield-renderer',
    template: '<ng-content/>',
    standalone: true,
    providers: [{provide: TransducerBufferConsumer, useExisting: FarfieldRendererComponent}],
})
export class FarfieldRendererComponent extends TransducerBufferConsumer
  implements OnDestroy
{
  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly diameter = input(0);
  readonly transducerModel = input<'Point' | 'Piston'>('Piston');

  upload = effect(() => {
    const env = this.environment();
    const transducers = this.transducers();
    const _dia = this.diameter();
    const _model = this.transducerModel();

    if (this.material) {
      this.uploadEnvironment(env);
      this.uploadArrayConfig(transducers);
    }
  });

  private material: FarfieldMaterial;
  private farfieldMesh: Mesh;

  ngxSceneAndBufferCreated(scene: Scene, buffer: UniformBuffer, textures: Textures): void {
    this.material = new FarfieldMaterial(scene);
    this.material.setTexture('viridisTexture', textures.viridis);

    const sampler = new TextureSampler();

    sampler.setParameters(); // use the default values
    sampler.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    this.material.setTextureSampler("viridisSampler", sampler);

    this.material.stencil.enabled = true;
    this.material.stencil.funcRef = 1;
    this.material.stencil.func = Engine.ALWAYS;
    this.material.stencil.opStencilDepthPass = Engine.REPLACE;

    this.farfieldMesh = new Mesh('farfieldMesh', scene);
    uvMesh.applyToMesh(this.farfieldMesh);
    this.farfieldMesh.increaseVertices(400);
    this.farfieldMesh.material = this.material;
    this.farfieldMesh.isPickable = false;
    this.farfieldMesh.renderingGroupId = 1;

    this.material.onBind = (_mesh: AbstractMesh) => {
      this.material
        .getEffect()
        .bindUniformBuffer(buffer.getBuffer()!, 'excitation');
    };

    this.material.setFloat('dynamicRange', 50.0);
    this.uploadEnvironment(this.environment());
    this.uploadArrayConfig(this.transducers());
  }

  ngOnDestroy(): void {
    this.farfieldMesh.dispose();
    this.material.dispose();
  }

  private uploadEnvironment(environment: Environment | null): void {
    if (environment) {
      const omega = 2.0 * Math.PI * frequencyFromBase(environment.excitationFrequencyBase, environment.excitationFrequencyMultiplier);

      this.material.setFloat('omega', omega);
      this.material.setFloat('k', omega / environment.speedOfSound);
      const ka = this.transducerModel() === 'Piston' ? (this.diameter() * omega / environment.speedOfSound) : 0;
      this.material.setFloat('ka', ka);
    }
  }

  private uploadArrayConfig(transducers: Transducer[] | null): void {
    if (transducers) {
      this.material.setInt('numElements', transducers.length);
    }
  }
}
