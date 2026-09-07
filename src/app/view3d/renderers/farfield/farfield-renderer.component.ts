import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import {
  addToScene,
  createMeshFromData,
  setMeshVisible,
  setShaderUniform,
  type Mesh,
  type ShaderMaterial,
} from '@babylonjs/lite';

import type { Environment } from 'src/app/core/environment';
import type { TransducerType } from 'src/app/core/transducer';
import type { Transducer } from 'src/app/store/store.service';
import { createFarfieldLiteMaterial } from '../../materials/farfield.material';
import { colormapTextureSampleRows } from '../../shared/colormap-texture';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { waveNumber } from '../../shared/wave-number';

// Babylon's legacy increaseVertices(400) produced 401 segments per source
// triangle edge. This grid preserves its 321,602-triangle density.
const farfieldGrid = createFarfieldGrid(401);

@Component({
  selector: 'app-farfield-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarfieldRendererComponent {
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly transducerModel = input.required<TransducerType>();
  readonly enabled = input(false);

  private material: ShaderMaterial | null = null;
  private mesh: Mesh | null = null;

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.material) return;

    this.material = createFarfieldLiteMaterial(context.colormap, context.excitation.storageBuffer);
    this.material.stencil = { compare: 'always', passOp: 'increment-clamp' };
    setShaderUniform(this.material, 'colormapY', colormapTextureSampleRows.viridis);

    this.mesh = createMeshFromData(
      context.engine,
      'farfield',
      farfieldGrid.positions,
      new Float32Array(farfieldGrid.positions.length),
      farfieldGrid.indices,
      farfieldGrid.uvs,
    );
    this.mesh.material = this.material;
    this.mesh.renderOrder = 1;
    this.mesh.pickable = false;
    addToScene(context.scene, this.mesh);
    this.updateRenderer();
  });

  private readonly update = effect(() => {
    this.transducers();
    this.environment();
    this.transducerModel();
    this.enabled();
    if (this.material && this.mesh) this.updateRenderer();
  });

  private updateRenderer(): void {
    if (!this.material || !this.mesh) return;
    const transducers = this.transducers() ?? [];
    const environment = this.environment();
    const model = this.transducerModel();

    setMeshVisible(this.mesh, this.enabled());
    setShaderUniform(this.material, 'numElements', transducers.length);
    if (!environment) return;

    const k = waveNumber(environment);
    setShaderUniform(this.material, 'k', k);
    setShaderUniform(
      this.material,
      'transducerType',
      model.type === 'Point' ? 0 : model.type === 'Piston' ? 1 : 2,
    );
    setShaderUniform(
      this.material,
      'ka',
      model.type === 'Rectangular'
        ? k * model.width
        : model.type === 'Piston'
          ? k * model.diameter
          : 0,
    );
    setShaderUniform(
      this.material,
      'kb',
      model.type === 'Rectangular'
        ? k * model.height
        : model.type === 'Piston'
          ? k * model.diameter
          : 0,
    );
  }
}

function createFarfieldGrid(subdivisions: number): {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
} {
  const verticesPerSide = subdivisions + 1;
  const positions = new Float32Array(verticesPerSide * verticesPerSide * 3);
  const uvs = new Float32Array(verticesPerSide * verticesPerSide * 2);
  const indices = new Uint32Array(subdivisions * subdivisions * 6);

  for (let y = 0; y <= subdivisions; y++) {
    for (let x = 0; x <= subdivisions; x++) {
      const vertex = y * verticesPerSide + x;
      const u = x / subdivisions;
      const v = y / subdivisions;
      positions.set([2 * u - 1, 2 * v - 1, 0], vertex * 3);
      // The legacy mesh uses UVs in the same -1..1 domain as its positions.
      uvs.set([2 * u - 1, 2 * v - 1], vertex * 2);
    }
  }

  let index = 0;
  for (let y = 0; y < subdivisions; y++) {
    for (let x = 0; x < subdivisions; x++) {
      const topLeft = y * verticesPerSide + x;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + verticesPerSide;
      const bottomRight = bottomLeft + 1;
      indices.set([topLeft, topRight, bottomLeft, topRight, bottomRight, bottomLeft], index);
      index += 6;
    }
  }

  return { positions, uvs, indices };
}
