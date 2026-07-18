import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  type OnDestroy,
  inject,
} from '@angular/core';
import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { TransducerBufferComponent } from '../../shared/transducer-buffer.component';
import type { Transducer } from 'src/app/store/store.service';
import type { RayleighProbePoint } from 'src/app/store/rayleigh.state';
import { rayleighVectorColor } from 'src/app/utils/rayleigh-vector-colors';

@Component({
  selector: 'app-rayleigh-vector-rays-renderer',
  template: '<ng-content/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class RayleighVectorRaysRendererComponent implements OnDestroy {
  readonly transducers = input<Transducer[] | null>(null);
  readonly point = input<RayleighProbePoint>({ x: 0, y: 0, z: 0.5 });
  readonly enabled = input<boolean>(false);

  private sceneRef: Scene | null = null;
  private raysMesh: LinesMesh | null = null;
  private raysMeshElementCount = 0;

  private readonly transducerBuffer = inject(TransducerBufferComponent, { optional: true });

  readonly update = effect(() => {
    const scene = this.transducerBuffer?.scene?.();
    if (scene && !this.sceneRef) {
      this.sceneRef = scene;
    }

    if (!this.sceneRef) {
      return;
    }

    const transducers = this.transducers() ?? [];
    const point = this.point();
    const enabled = this.enabled();

    if (!enabled || transducers.length === 0) {
      this.raysMesh?.setEnabled(false);
      return;
    }

    // Babylon can update line positions in-place, but it cannot change the line count.
    // Recreate the mesh if the number of transducers (thus line segments) changed.
    if (this.raysMesh && this.raysMeshElementCount !== transducers.length) {
      this.raysMesh.dispose();
      this.raysMesh = null;
      this.raysMeshElementCount = 0;
    }

    const lines = transducers.map((transducer) => [
      new Vector3(transducer.pos.x, transducer.pos.y, transducer.pos.z),
      new Vector3(point.x, point.y, point.z),
    ]);
    const colors = transducers.map((_, index) => {
      const color = rayleighVectorColor(index);
      const lineColor = new Color4(color.r, color.g, color.b, 0.75);
      return [lineColor, lineColor];
    });

    if (this.raysMesh) {
      CreateLineSystem(
        'rayleighProbeRays',
        {
          lines,
          colors,
          updatable: true,
          instance: this.raysMesh,
        },
        this.sceneRef,
      );
    } else {
      this.raysMesh = CreateLineSystem(
        'rayleighProbeRays',
        {
          lines,
          colors,
          updatable: true,
        },
        this.sceneRef,
      );
      this.raysMesh.isPickable = false;
      this.raysMesh.alwaysSelectAsActiveMesh = true;
      this.raysMesh.doNotSyncBoundingInfo = true;
      this.raysMesh.renderingGroupId = 2;
      this.raysMeshElementCount = transducers.length;
    }

    this.raysMesh.setEnabled(true);
  });

  ngOnDestroy(): void {
    this.raysMesh?.dispose();
  }
}
