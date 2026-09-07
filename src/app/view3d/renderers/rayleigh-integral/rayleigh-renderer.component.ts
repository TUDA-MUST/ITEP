import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import {
  addToScene,
  createMeshFromData,
  setMeshVisible,
  setShaderUniform,
  type Mesh,
  type ShaderMaterial,
} from '@babylonjs/lite';

import type { Environment } from 'src/app/core/environment';
import type { ResultSet } from 'src/app/store/rayleigh.state';
import type { Transducer } from 'src/app/store/store.service';
import { createRayleighLiteMaterial, LiteResultAspect } from '../../materials/rayleigh.material';
import { colormapTextureSampleRows } from '../../shared/colormap-texture';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { waveNumber } from '../../shared/wave-number';
import { rayleighGeometry } from './rayleigh.geometry';

const resultSets: ResultSet[] = ['XZPlane', 'YZPlane', 'CutCube'];

@Component({
  selector: 'app-rayleigh-integral-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RayleighIntegralRendererComponent implements OnDestroy {
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly environment = input<Environment | null>(null);
  readonly resultSet = input<ResultSet>('XZPlane');
  readonly aspect = input<number | null>(null);
  readonly globalPhase = input(0);
  readonly enabled = input(false);
  readonly vectorModeEnabled = input(false);

  private material: ShaderMaterial | null = null;
  private readonly meshes = new Map<ResultSet, Mesh>();

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.material) return;

    this.material = createRayleighLiteMaterial(context.colormap, context.excitation.storageBuffer);
    this.material.stencil = { compare: 'always', passOp: 'increment-clamp' };
    setShaderUniform(this.material, 'elongationColormapY', colormapTextureSampleRows.coolwarm);
    setShaderUniform(this.material, 'magnitudeColormapY', colormapTextureSampleRows.viridis);
    setShaderUniform(this.material, 'phaseColormapY', colormapTextureSampleRows.twilightShifted);
    setShaderUniform(this.material, 'viewmode', LiteResultAspect.Elongation);

    for (const resultSet of resultSets) {
      const geometry = rayleighGeometry(resultSet);
      const mesh = createMeshFromData(
        context.engine,
        `rayleigh-${resultSet}`,
        geometry.positions,
        new Float32Array(geometry.positions.length),
        geometry.indices,
      );
      mesh.material = this.material;
      mesh.renderOrder = 0;
      mesh.pickable = false;
      this.meshes.set(resultSet, mesh);
      addToScene(context.scene, mesh);
    }

    this.updateRenderer();
  });

  private readonly update = effect(() => {
    this.transducers();
    this.environment();
    this.resultSet();
    this.aspect();
    this.globalPhase();
    this.enabled();
    this.vectorModeEnabled();
    if (this.material) this.updateRenderer();
  });

  private updateRenderer(): void {
    if (!this.material) return;

    const transducers = this.transducers() ?? [];
    const environment = this.environment();
    const selectedResultSet = this.resultSet();
    const enabled = this.enabled();
    const vectorModeEnabled = this.vectorModeEnabled();
    const activeMesh = this.meshes.get(selectedResultSet) ?? null;

    for (const [resultSet, mesh] of this.meshes) {
      const visible = enabled && resultSet === selectedResultSet;
      setMeshVisible(mesh, visible);
      // Lite excludes non-pickable candidates before applying a picker filter.
      mesh.pickable = visible && vectorModeEnabled;
    }
    this.resources.activeRayleighMesh.set(enabled && vectorModeEnabled ? activeMesh : null);

    setShaderUniform(this.material, 'numElements', transducers.length);
    setShaderUniform(this.material, 'globalPhase', this.globalPhase());
    if (this.aspect() !== null) {
      setShaderUniform(this.material, 'viewmode', this.aspect()!);
    }
    if (environment) setShaderUniform(this.material, 'k', waveNumber(environment));
  }

  ngOnDestroy(): void {
    if (this.resources.activeRayleighMesh() && this.meshes.has(this.resultSet())) {
      this.resources.activeRayleighMesh.set(null);
    }
  }
}
