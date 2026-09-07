import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import {
  addToScene,
  createSphere,
  onBeforeRender,
  setMeshVisible,
  type Mesh,
} from '@babylonjs/lite';

import type { RayleighProbePoint, ResultSet } from 'src/app/store/rayleigh.state';
import type { Transducer } from 'src/app/store/store.service';
import { createRayleighProbeMaterial } from '../../materials/rayleigh-probe.material';
import { LiteRendererResourcesDirective } from '../../smart-components/lite-renderer-resources/lite-renderer-resources.directive';
import { LiteViewDirective } from '../../smart-components/lite-view/lite-view.directive';

const probeDiameter = 0.01125;

@Component({
  selector: 'app-rayleigh-probe-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RayleighProbeRendererComponent implements OnDestroy {
  private readonly view = inject(LiteViewDirective);
  private readonly resources = inject(LiteRendererResourcesDirective);

  readonly transducers = input<Transducer[] | null>(null);
  readonly enabled = input(false);
  readonly resultSet = input<ResultSet>('XZPlane');
  readonly point = input<RayleighProbePoint>({ x: 0, y: 0, z: 0.5 });
  readonly pointChange = output<RayleighProbePoint>();

  private mesh: Mesh | null = null;
  private removePointerListeners: (() => void) | null = null;
  private pointerId: number | null = null;
  private pendingPointerId: number | null = null;

  private readonly initialize = effect(() => {
    const context = this.resources.bufferContext();
    if (!context || this.mesh) return;

    this.mesh = createSphere(context.engine, {
      diameter: probeDiameter,
      segments: 16,
    });
    this.mesh.material = createRayleighProbeMaterial();
    this.mesh.renderOrder = 2;
    this.mesh.pickable = false;
    addToScene(context.scene, this.mesh);
    this.resources.rayleighProbeMesh.set(this.mesh);
    onBeforeRender(context.scene, () => this.updateScale());
    this.updateProbe();
  });

  private readonly update = effect(() => {
    this.transducers();
    this.enabled();
    this.resultSet();
    this.point();
    if (this.mesh) this.updateProbe();
  });

  private readonly initializePicking = effect(() => {
    if (this.resources.pickerReady() && !this.removePointerListeners) {
      this.enablePicking();
    }
  });

  private updateProbe(): void {
    if (!this.mesh) return;
    const point = this.point();
    const enabled = this.enabled() && (this.transducers()?.length ?? 0) > 0;
    this.mesh.position.set(point.x, point.y, point.z);
    setMeshVisible(this.mesh, enabled);
    this.mesh.pickable = enabled;
    if (!enabled) this.endDrag();
  }

  private updateScale(): void {
    const context = this.view.context();
    const camera = context?.camera;
    if (!this.mesh || !camera) return;
    const distance = Math.max(
      0.001,
      Math.hypot(
        camera.worldMatrix[12] - this.mesh.position.x,
        camera.worldMatrix[13] - this.mesh.position.y,
        camera.worldMatrix[14] - this.mesh.position.z,
      ),
    );
    const worldDiameter =
      (12 * (2 * distance * Math.tan(camera.fov / 2))) / Math.max(this.view.canvas.clientHeight, 1);
    const scale = worldDiameter / probeDiameter;
    this.mesh.scaling.set(scale, scale, scale);
  }

  private enablePicking(): void {
    const canvas = this.view.canvas;
    const onPointerMove = (event: PointerEvent) => {
      if (!this.resources.draggingRayleighProbe()) return;
      const target = this.resources.activeRayleighMesh();
      if (!target) return;
      const bounds = canvas.getBoundingClientRect();
      void this.moveProbe(event.clientX - bounds.left, event.clientY - bounds.top, target);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!this.enabled()) return;
      const bounds = canvas.getBoundingClientRect();
      void this.beginDrag(event.pointerId, event.clientX - bounds.left, event.clientY - bounds.top);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId === this.pendingPointerId) this.pendingPointerId = null;
      if (event.pointerId === this.pointerId) this.endDrag();
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    this.removePointerListeners = () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }

  private async beginDrag(pointerId: number, x: number, y: number): Promise<void> {
    if (!this.mesh) return;
    this.pendingPointerId = pointerId;
    const result = await this.resources.pick(x, y, (mesh) => mesh === this.mesh);
    if (result?.pickedMesh === this.mesh) {
      if (this.pendingPointerId !== pointerId) return;
      this.pendingPointerId = null;
      this.pointerId = pointerId;
      this.resources.draggingRayleighProbe.set(true);
      this.view.canvas.setPointerCapture(pointerId);
      this.view.canvas.style.cursor = 'grabbing';
      this.view.setControlsEnabled(false);
      return;
    }

    if (this.pendingPointerId === pointerId) this.pendingPointerId = null;
    const target = this.resources.activeRayleighMesh();
    if (target) await this.pickPoint(x, y, target);
  }

  private async moveProbe(x: number, y: number, target: Mesh): Promise<void> {
    await this.pickPoint(x, y, target);
  }

  private async pickPoint(x: number, y: number, target: Mesh): Promise<void> {
    const result = await this.resources.pick(x, y, (mesh) => mesh === target);
    if (result?.pickedMesh !== target || !result.pickedPoint) return;
    const [xPoint, yPoint, zPoint] = result.pickedPoint;
    this.pointChange.emit(this.clampPoint({ x: xPoint, y: yPoint, z: zPoint }, this.resultSet()));
  }

  private endDrag(): void {
    if (!this.resources.draggingRayleighProbe() && this.pointerId === null) return;
    if (this.pointerId !== null && this.view.canvas.hasPointerCapture(this.pointerId)) {
      this.view.canvas.releasePointerCapture(this.pointerId);
    }
    this.pointerId = null;
    this.resources.draggingRayleighProbe.set(false);
    this.view.canvas.style.cursor = '';
    this.view.setControlsEnabled(true);
  }

  private clampPoint(point: RayleighProbePoint, resultSet: ResultSet): RayleighProbePoint {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    if (resultSet === 'XZPlane') {
      return {
        x: clamp(point.x, -0.5, 0.5),
        y: 0,
        z: clamp(point.z, 0, 1),
      };
    }
    if (resultSet === 'YZPlane') {
      return {
        x: 0,
        y: clamp(point.y, -0.5, 0.5),
        z: clamp(point.z, 0, 1),
      };
    }
    return {
      x: clamp(point.x, -0.5, 0.5),
      y: clamp(point.y, -0.5, 0.5),
      z: clamp(point.z, 0, 1),
    };
  }

  ngOnDestroy(): void {
    this.endDrag();
    this.removePointerListeners?.();
    if (this.resources.rayleighProbeMesh() === this.mesh) {
      this.resources.rayleighProbeMesh.set(null);
    }
  }
}
