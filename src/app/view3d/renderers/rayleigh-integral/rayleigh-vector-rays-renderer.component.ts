import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import {
  addToScene,
  createLineMaterial,
  createLineSystem,
  removeFromScene,
  setMeshVisible,
  updateLineSystem,
  type Mesh,
} from '@babylonjs/lite';

import type { RayleighProbePoint } from 'src/app/store/rayleigh.state';
import type { Transducer } from 'src/app/store/store.service';
import { rayleighVectorColor } from 'src/app/utils/rayleigh-vector-colors';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';

@Component({
  selector: 'app-rayleigh-vector-rays-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RayleighVectorRaysRendererComponent {
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly point = input<RayleighProbePoint>({ x: 0, y: 0, z: 0.5 });
  readonly enabled = input(false);

  private mesh: Mesh | null = null;
  private rayCount = 0;

  private readonly update = effect(() => {
    const context = this.resources.bufferContext();
    const transducers = this.transducers() ?? [];
    const point = this.point();
    const enabled = this.enabled() && transducers.length > 0;
    if (!context) return;

    if (!enabled) {
      if (this.mesh) setMeshVisible(this.mesh, false);
      return;
    }

    const lines = transducers.map((transducer) => [
      { x: transducer.pos.x, y: transducer.pos.y, z: transducer.pos.z },
      { x: point.x, y: point.y, z: point.z },
    ]);
    const colors = transducers.map((_, index) => {
      const color = rayleighVectorColor(index);
      const lineColor = { r: color.r, g: color.g, b: color.b, a: 0.75 };
      return [lineColor, lineColor];
    });

    if (this.mesh && this.rayCount !== transducers.length) {
      removeFromScene(context.scene, this.mesh);
      this.mesh = null;
      this.rayCount = 0;
    }

    if (this.mesh) {
      updateLineSystem(context.engine, this.mesh, { lines, colors });
    } else {
      const material = createLineMaterial({
        color: { r: 1, g: 1, b: 1, a: 1 },
        useVertexColor: true,
        useVertexAlpha: true,
        depthCompare: 'always',
        depthWrite: false,
      });
      this.mesh = createLineSystem(context.engine, {
        name: 'rayleighProbeRays',
        lines,
        colors,
        material,
        useVertexAlpha: true,
      });
      this.mesh.renderOrder = 2;
      this.mesh.pickable = false;
      this.rayCount = transducers.length;
      addToScene(context.scene, this.mesh);
    }
    setMeshVisible(this.mesh, true);
  });
}
