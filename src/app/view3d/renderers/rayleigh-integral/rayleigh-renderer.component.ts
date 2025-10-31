import { ChangeDetectionStrategy, Component, effect, input, OnDestroy } from '@angular/core';

import { Plane } from '@babylonjs/core/Maths/math.plane';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { RayleighMaterial, ResultAspect } from '../../materials/rayleigh.material';
import { UniformBuffer } from '@babylonjs/core/Materials/uniformBuffer';

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { Textures, TransducerBufferConsumer } from '../../shared/transducer-buffer.component';
import { Engine } from '@babylonjs/core/Engines/engine';
import { ResultSet } from 'src/app/store/rayleigh.state';
import { Environment, Transducer } from 'src/app/store/store.service';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';

export const cubeCut = (): VertexData => {
  const positions = [
    -0.5, -0.5, 0, 
    0.5, -0.5, 0, 
    0.5, 0.5, 0, 
    0.0, 0.5, 0,
    0.0, 0.0, 0,
    -0.5, 0.0, 0,

    -0.5, -0.5, 1, 
    0.5, -0.5, 1, 
    0.5, 0.5, 1, 
    0.0, 0.5, 1,
    0.0, 0.0, 1,
    -0.5, 0.0, 1,
  ];

  const indices = [
    0, 2, 1, 
    0, 5, 4,
    4, 3, 2,
  
    4,10,3,
    10, 9, 3,
    2, 3, 9,
    2, 9, 8,

    5, 11, 4,
    11,10,4,
    0, 6, 5,
    6, 11, 5,

    0, 1, 6,
    1, 7, 6,

    1, 2, 7,
    2, 8, 7,

    6, 8, 7, 
    6, 11, 10,
    10, 9, 8,
  ];

  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  return vertexData;
};

@Component({
    selector: 'app-rayleigh-integral-renderer',
    template: '<ng-content/>',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    providers: [{provide: TransducerBufferConsumer, useExisting: RayleighIntegralRendererComponent}],
})
export class RayleighIntegralRendererComponent extends TransducerBufferConsumer implements OnDestroy {
  // Should no longer be needed or changed to a number.
  transducers = input<Transducer[] | null>(null);
  environment = input<Environment | null>(null);
  resultSet = input<ResultSet | null>(null);
  aspect = input<ResultAspect | null>(null);
  globalPhase = input<number | null>(null);
  
  private material: RayleighMaterial;

  update = effect(() => {
    if (this.material) {
      this.uploadEnvironment(this.environment());
      this.uploadArrayConfig(this.transducers());
      this.material.setResultAspect(this.aspect());
    }

    const resultSet = this.resultSet();
    if (resultSet !== null) {
      this.xzPlane.setEnabled(resultSet === 'XZPlane');
      this.yzPlane.setEnabled(resultSet === 'YZPlane');
      this.cubeCut.setEnabled(resultSet === 'CutCube');
    }
  });

  updatePhase = effect(() => {
    this.material.setFloat('globalPhase', this.globalPhase() ?? 0);
  })

  private xzPlane : Mesh;
  private yzPlane : Mesh;
  private cubeCut : Mesh;

  ngxSceneAndBufferCreated(scene: Scene, buffer: UniformBuffer, textures : Textures): void {
    // Result
    this.material = new RayleighMaterial(scene, textures.coolwarm);
    this.material.setUniformBuffer('excitation', buffer);      

    this.material.stencil.enabled = true;
    this.material.stencil.funcRef = 1;
    this.material.stencil.func = Engine.ALWAYS;
    this.material.stencil.opStencilDepthPass = Engine.REPLACE;

    // Setup Aperture
    const origin = new Vector3(0, 0, 0);
    const xNegative = new Vector3(-1, 0, 0);
    const yPositive = new Vector3(0, 1, 0);

    // Setup result plane
    const xzMathPlane = Plane.FromPositionAndNormal(origin, yPositive);
    this.xzPlane = CreatePlane('rayleigh', {
      sourcePlane: xzMathPlane,
    }, scene);
    this.xzPlane.material = this.material;
    this.xzPlane.position = new Vector3(0, 0, 0.5);
    this.xzPlane.bakeCurrentTransformIntoVertices();
    this.xzPlane.isPickable = false;
    this.xzPlane.renderingGroupId = 1;

    const yzMathPlane = Plane.FromPositionAndNormal(origin, xNegative);
    this.yzPlane = CreatePlane('rayleigh', {
      sourcePlane: yzMathPlane,
    }, scene);
    this.yzPlane.material = this.material;
    this.yzPlane.position = new Vector3(0, 0, 0.5);
    this.yzPlane.bakeCurrentTransformIntoVertices();
    this.yzPlane.isPickable = false;
    this.yzPlane.renderingGroupId = 1;
    this.yzPlane.setEnabled(false);

    this.cubeCut = new Mesh('cubeCut', scene);
    cubeCut().applyToMesh(this.cubeCut);
    this.cubeCut.material = this.material;
    this.cubeCut.isPickable = false;
    this.cubeCut.renderingGroupId = 1;
    this.cubeCut.setEnabled(false);

    this.material.setFloat('dynamicRange', 10);
    this.material.setResultAspect(this.aspect());
    this.uploadArrayConfig(this.transducers());
    this.uploadEnvironment(this.environment());
  }

  ngOnDestroy(): void {
    this.material.dispose();
    this.xzPlane.dispose();
    this.yzPlane.dispose();
    this.cubeCut.dispose();
  }

  private uploadEnvironment(environment : Environment | null) : void {
    if (environment) {
      const omega = 2.0 * Math.PI * 40000;

      this.material.setFloat('omega', omega);
      this.material.setFloat('k', omega / environment.speedOfSound);
    }
  }

  private uploadArrayConfig(transducers: Transducer[] | null) : void {
    if (transducers) {
      this.material.setInt('numElements', transducers.length);
    }
  }
}
