import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import {
  addToScene,
  createLineSystem,
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
import { uvHexagon } from '../../shared/hexagonal.geometry';
import { triangleEdges, wireframePreview } from '../../shared/mesh-preview';
import { subdivideGeometry } from '../../shared/subdivide.geometry';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { LiteViewDirective } from '../../smart-components/lite-view/lite-view.directive';
import { waveNumber } from '../../shared/wave-number';

// 216 segments give nearly the same triangle area as the former 401 x 401
// square grid, with 279,936 triangles instead of 321,602 before disk masking.
const farfieldGrid = subdivideGeometry(uvHexagon, 216);

@Component({
  selector: 'app-farfield-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarfieldRendererComponent {
  private readonly resources = inject(LiteRendererResourcesDirective);
  private readonly view = inject(LiteViewDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly transducerModel = input.required<TransducerType>();
  readonly enabled = input(false);

  private material: ShaderMaterial | null = null;
  private mesh: Mesh | null = null;

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.mesh) return;

    if (wireframePreview !== null) {
      const grid = wireframePreview === 'full' ? farfieldGrid : uvHexagon;
      this.mesh = createLineSystem(context.engine, {
        name: 'farfield-wireframe',
        lines: triangleEdges(grid.positions, grid.indices, 0.02),
        color: { r: 0.3, g: 0.85, b: 1, a: 1 },
      });
      this.mesh.pickable = false;
      addToScene(context.scene, this.mesh);
      this.updateRenderer();
      this.view.requestRender();
      return;
    }

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
    this.view.requestRender();
  });

  private readonly update = effect(() => {
    this.transducers();
    this.environment();
    this.transducerModel();
    this.enabled();
    if (this.mesh) {
      this.updateRenderer();
      this.view.requestRender();
    }
  });

  private updateRenderer(): void {
    if (!this.mesh) return;
    setMeshVisible(this.mesh, this.enabled());
    if (!this.material) return;
    const transducers = this.transducers() ?? [];
    const environment = this.environment();
    const model = this.transducerModel();

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
