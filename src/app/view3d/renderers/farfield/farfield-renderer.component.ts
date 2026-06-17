import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  type OnDestroy,
} from '@angular/core';

import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { FarfieldMaterial } from '../../materials/farfield.material';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { TransducerBufferComponent } from '../../shared/transducer-buffer.component';
import { Engine } from '@babylonjs/core/Engines/engine';
import type { Transducer } from 'src/app/store/store.service';
import { frequencyFromBase, type Environment } from 'src/app/core/environment';
import type { TransducerType } from 'src/app/core/transducer';

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
})
export class FarfieldRendererComponent implements OnDestroy {
  private readonly transducerBuffer = inject(TransducerBufferComponent);

  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly transducerModel = input.required<TransducerType>();

  upload = effect(() => {
    const env = this.environment();
    const transducers = this.transducers();
    const _model = this.transducerModel();

    if (this.material) {
      this.uploadEnvironment(env);
      this.uploadArrayConfig(transducers);
    }
  });

  private material: FarfieldMaterial;
  private farfieldMesh: Mesh;

  private readonly initEffect = effect(() => {
    const ctx = this.transducerBuffer.bufferContext();
    if (!ctx || this.material) return;

    this.material = new FarfieldMaterial(ctx.scene, ctx.textures.colormaps);

    this.material.stencil.enabled = true;
    this.material.stencil.funcRef = 1;
    this.material.stencil.func = Engine.ALWAYS;
    this.material.stencil.opStencilDepthPass = Engine.REPLACE;

    this.farfieldMesh = new Mesh('farfieldMesh', ctx.scene);
    uvMesh.applyToMesh(this.farfieldMesh);
    this.farfieldMesh.increaseVertices(400);
    this.farfieldMesh.material = this.material;
    this.farfieldMesh.isPickable = false;
    this.farfieldMesh.renderingGroupId = 1;

    this.material.onBind = (_mesh: AbstractMesh) => {
      this.material.getEffect().bindUniformBuffer(ctx.buffer.getBuffer()!, 'excitation');
    };

    this.material.setFloat('dynamicRange', 50.0);
    this.uploadEnvironment(this.environment());
    this.uploadArrayConfig(this.transducers());
  });

  ngOnDestroy(): void {
    this.farfieldMesh?.dispose();
    this.material?.dispose();
  }

  private uploadEnvironment(environment: Environment | null): void {
    if (environment) {
      const omega =
        2.0 *
        Math.PI *
        frequencyFromBase(
          environment.excitationFrequencyBase,
          environment.excitationFrequencyMultiplier,
        );

      const k = omega / environment.speedOfSound;
      this.material.setFloat('k', k);

      const model = this.transducerModel();

      let ka = 0;
      let kb = 0;
      switch (model.type) {
        case 'Point':
          break;
        case 'Piston':
          ka = model.diameter * k;
          kb = ka;
          break;
        case 'Rectangular':
          ka = model.width * k;
          kb = model.height * k;
          break;
      }

      this.material.setFloat('ka', ka);
      this.material.setFloat('kb', kb);
      this.material.setTransducerModel(model);
    }
  }

  private uploadArrayConfig(transducers: Transducer[] | null): void {
    if (transducers) {
      this.material.setInt('numElements', transducers.length);
    }
  }
}
