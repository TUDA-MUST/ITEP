import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  type OnDestroy,
  inject,
  signal,
} from '@angular/core';
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Rendering/outlineRenderer';
import { PointerDragBehavior } from '@babylonjs/core/Behaviors/Meshes/pointerDragBehavior';
import { Plane } from '@babylonjs/core/Maths/math.plane';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import type { ResultSet, RayleighProbePoint } from 'src/app/store/rayleigh.state';
import { cubeCut } from './rayleigh-renderer.component';
import { TransducerBufferComponent } from '../../shared/transducer-buffer.component';

@Component({
  selector: 'app-rayleigh-probe-renderer',
  template: '<ng-content/>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RayleighProbeRendererComponent implements OnDestroy {
  readonly enabled = input<boolean>(false);
  readonly resultSet = input<ResultSet>('XZPlane');
  readonly point = input<RayleighProbePoint>({ x: 0, y: 0, z: 0.5 });
  readonly pointChange = output<RayleighProbePoint>();

  private sceneRef: Scene | null = null;
  private pointerObserver: Observer<PointerInfo> | null = null;
  private beforeRenderObserver: Observer<Scene> | null = null;
  private dragBehavior: PointerDragBehavior | null = null;
  private marker: Mesh | null = null;
  private readonly markerSignal = signal<Mesh | null>(null);
  private xzPickPlane: Mesh | null = null;
  private yzPickPlane: Mesh | null = null;
  private cubePickMesh: Mesh | null = null;
  private dragging = false;
  private hovered = false;

  private readonly transducerBuffer = inject(TransducerBufferComponent, { optional: true });
  private pendingAnimationFrame: number | null = null;

  readonly update = effect(() => {
    const marker = this.markerSignal();
    if (!marker || !this.sceneRef) {
      return;
    }

    const enabled = this.enabled();
    const resultSet = this.resultSet();
    const clamped = this.clampPoint(this.point(), resultSet);

    marker.setEnabled(enabled);
    marker.position.set(clamped.x, clamped.y, clamped.z);

    this.updateScale();

    if (this.dragBehavior) {
      this.dragBehavior.enabled = enabled;
      if (this.dragBehavior.options.dragPlaneNormal) {
        if (resultSet === 'XZPlane') {
          this.dragBehavior.options.dragPlaneNormal.set(0, 1, 0);
        } else if (resultSet === 'YZPlane') {
          this.dragBehavior.options.dragPlaneNormal.set(1, 0, 0);
        } else {
          this.dragBehavior.options.dragPlaneNormal.set(0, 0, 1);
        }
      }
    }

    this.xzPickPlane?.setEnabled(enabled && resultSet === 'XZPlane');
    this.yzPickPlane?.setEnabled(enabled && resultSet === 'YZPlane');
    this.cubePickMesh?.setEnabled(enabled && resultSet === 'CutCube');

    if (!enabled) {
      if (this.dragging && this.sceneRef) {
        const canvas = this.sceneRef.getEngine().getRenderingCanvas();
        this.sceneRef.activeCamera?.attachControl(canvas, true);
      }
      this.dragging = false;
    }
  });

  private updateScale(): void {
    const marker = this.marker;
    if (!marker || !this.sceneRef) {
      return;
    }
    const camera = this.sceneRef.activeCamera;
    if (camera) {
      const hoverMultiplier = this.dragging || this.hovered ? 1.15 : 1.0;
      try {
        const engine = this.sceneRef.getEngine();
        const canvasHeight =
          (engine.getRenderHeight &&
            engine.getHardwareScalingLevel &&
            engine.getRenderHeight() * engine.getHardwareScalingLevel()) ||
          (engine.getRenderingCanvas() &&
            (engine.getRenderingCanvas() as HTMLCanvasElement).clientHeight) ||
          600;
        const camPos = camera.position;
        const d = Math.max(
          0.001,
          Math.hypot(
            camPos.x - marker.position.x,
            camPos.y - marker.position.y,
            camPos.z - marker.position.z,
          ),
        );
        const fov = (camera as unknown as { fov?: number }).fov ?? Math.PI / 4;
        const worldPerPixel = (2 * d * Math.tan(fov / 2)) / canvasHeight;
        const desiredPx = 12;
        const worldDiameter = desiredPx * worldPerPixel;
        const baseDiameter = 0.01125;
        const scale = (worldDiameter / baseDiameter) * hoverMultiplier;
        marker.scaling.set(scale, scale, scale);
      } catch {
        const camPos = camera.position;
        const d = Math.max(
          0.001,
          Math.hypot(
            camPos.x - marker.position.x,
            camPos.y - marker.position.y,
            camPos.z - marker.position.z,
          ),
        );
        const desiredScreenSize = 0.01125;
        const scale = desiredScreenSize * d * hoverMultiplier;
        marker.scaling.set(scale, scale, scale);
      }
    }
  }

  constructor() {
    // react to availability of the scene provided by TransducerBufferComponent
    effect(() => {
      const scene = this.transducerBuffer?.scene?.();
      if (scene && !this.sceneRef) {
        this.initializeScene(scene);
      }
    });
  }

  private initializeScene(scene: Scene): void {
    this.sceneRef = scene;

    this.marker = CreateSphere(
      'rayleighProbeMarker',
      {
        diameter: 0.01125,
        segments: 16,
      },
      scene,
    );
    this.marker.isPickable = true;
    this.marker.renderingGroupId = 2;
    this.marker.renderOutline = true;
    this.marker.outlineColor = new Color3(0.2, 0.2, 0.2); // #333 border like the joystick knob
    this.marker.outlineWidth = 0.0015;

    // Make marker behave like a screen-space handle: small but constant on zoom
    // Use billboard mode and scale with camera distance in the update effect.
    this.marker.billboardMode = 7; // all axes

    const markerMaterial = new StandardMaterial('rayleighProbeMaterial', scene);

    // Resolve CSS variables using a temporary element so nested var() calls compute correctly,
    // falling back to rgb(0,0,0) if the variable does not exist.
    const getCssVarResolved = (name: string): string => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return '';
      const canvas = scene.getEngine().getRenderingCanvas();
      const target = canvas || document.body;
      const temp = document.createElement('span');
      temp.style.color = `var(${name}, rgb(0, 0, 0))`;
      target.appendChild(temp);
      const computedColor = getComputedStyle(temp).color;
      target.removeChild(temp);
      return computedColor;
    };

    const resolvedColor = getCssVarResolved('--mat-sys-primary');

    const parseRgbString = (rgbStr: string): [number, number, number] | null => {
      if (!rgbStr) return null;
      const matches = rgbStr.match(/[\d\.]+/g);
      if (matches && matches.length >= 3) {
        const r = parseFloat(matches[0]) / 255;
        const g = parseFloat(matches[1]) / 255;
        const b = parseFloat(matches[2]) / 255;
        return [
          Math.min(1, Math.max(0, r)),
          Math.min(1, Math.max(0, g)),
          Math.min(1, Math.max(0, b)),
        ];
      }
      return null;
    };

    const rgb = (resolvedColor ? parseRgbString(resolvedColor) : null) ?? [0.49, 0.3, 1.0];
    markerMaterial.diffuseColor = new Color3(0, 0, 0);
    markerMaterial.emissiveColor = new Color3(rgb[0], rgb[1], rgb[2]);
    markerMaterial.specularColor = new Color3(0, 0, 0);
    markerMaterial.disableLighting = true; // Disable lighting to prevent saturation under hemispheric light
    this.marker.material = markerMaterial;

    // Use ActionManager to track hover state for scaling and cursor styling
    const actionManager = new ActionManager(scene);
    actionManager.hoverCursor = 'grab';
    this.marker.actionManager = actionManager;
    actionManager.registerAction(
      new ExecuteCodeAction({ trigger: ActionManager.OnPointerOverTrigger }, () => {
        this.hovered = true;
        this.updateScale();
      }),
    );
    actionManager.registerAction(
      new ExecuteCodeAction({ trigger: ActionManager.OnPointerOutTrigger }, () => {
        this.hovered = false;
        this.updateScale();
      }),
    );

    // Initialize PointerDragBehavior for smooth 3D dragging
    this.dragBehavior = new PointerDragBehavior({
      dragPlaneNormal: new Vector3(0, 1, 0),
    });
    this.dragBehavior.useObjectOrientationForDragging = false;
    this.dragBehavior.moveAttached = false;

    let dragOffset = Vector3.Zero();

    this.dragBehavior.onDragStartObservable.add((event) => {
      dragOffset = this.marker
        ? this.marker.position.subtract(event.dragPlanePoint)
        : Vector3.Zero();
      this.dragging = true;
      this.updateScale();
      if (this.marker?.actionManager) {
        this.marker.actionManager.hoverCursor = 'grabbing';
      }
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas) {
        canvas.style.cursor = 'grabbing';
      }
    });

    let pendingPoint: RayleighProbePoint | null = null;

    this.dragBehavior.onDragObservable.add((event) => {
      const targetPoint = event.dragPlanePoint.add(dragOffset);
      const nextPoint = this.clampPoint(
        {
          x: targetPoint.x,
          y: targetPoint.y,
          z: targetPoint.z,
        },
        this.resultSet(),
      );
      if (this.marker) {
        this.marker.position.set(nextPoint.x, nextPoint.y, nextPoint.z);
      }
      pendingPoint = nextPoint;
      if (this.pendingAnimationFrame === null) {
        this.pendingAnimationFrame = requestAnimationFrame(() => {
          this.pendingAnimationFrame = null;
          if (pendingPoint) {
            this.pointChange.emit(pendingPoint);
          }
        });
      }
    });

    this.dragBehavior.onDragEndObservable.add(() => {
      dragOffset = Vector3.Zero();
      this.dragging = false;
      this.updateScale();
      if (this.marker?.actionManager) {
        this.marker.actionManager.hoverCursor = 'grab';
      }
      if (this.pendingAnimationFrame !== null) {
        cancelAnimationFrame(this.pendingAnimationFrame);
        this.pendingAnimationFrame = null;
      }
      if (pendingPoint) {
        this.pointChange.emit(pendingPoint);
      }
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas) {
        canvas.style.cursor = '';
      }
    });

    this.marker.addBehavior(this.dragBehavior);

    const origin = new Vector3(0, 0, 0);
    const xNegative = new Vector3(-1, 0, 0);
    const yPositive = new Vector3(0, 1, 0);

    this.xzPickPlane = CreatePlane(
      'rayleighProbePickXZ',
      {
        sourcePlane: Plane.FromPositionAndNormal(origin, yPositive),
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    );
    this.xzPickPlane.position = new Vector3(0, 0, 0.5);
    this.xzPickPlane.bakeCurrentTransformIntoVertices();

    this.yzPickPlane = CreatePlane(
      'rayleighProbePickYZ',
      {
        sourcePlane: Plane.FromPositionAndNormal(origin, xNegative),
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    );
    this.yzPickPlane.position = new Vector3(0, 0, 0.5);
    this.yzPickPlane.bakeCurrentTransformIntoVertices();

    this.cubePickMesh = new Mesh('rayleighProbePickCube', scene);
    cubeCut().applyToMesh(this.cubePickMesh);

    [this.xzPickPlane, this.yzPickPlane, this.cubePickMesh].forEach((mesh) => {
      mesh.isPickable = true;
      mesh.renderingGroupId = 0;
      mesh.visibility = 0.001;
      const material = new StandardMaterial(`${mesh.name}Material`, scene);
      material.alpha = 0;
      material.backFaceCulling = false;
      mesh.material = material;
      mesh.setEnabled(false);
    });

    this.beforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
      this.updateScale();
    });

    // Pointer down click-to-jump on the result plane
    this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (!this.enabled()) {
        return;
      }

      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const hitInfo = pointerInfo.pickInfo;
        if (hitInfo?.hit && hitInfo.pickedMesh === this.marker) {
          return;
        }

        const pickMesh = this.activePickMesh();
        if (pickMesh) {
          const hitPick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === pickMesh);
          if (hitPick?.hit && hitPick.pickedPoint) {
            const nextPoint = this.clampPoint(
              {
                x: hitPick.pickedPoint.x,
                y: hitPick.pickedPoint.y,
                z: hitPick.pickedPoint.z,
              },
              this.resultSet(),
            );
            this.pointChange.emit(nextPoint);
          }
        }
      }
    });

    this.markerSignal.set(this.marker);
  }

  ngOnDestroy(): void {
    if (this.pendingAnimationFrame !== null) {
      cancelAnimationFrame(this.pendingAnimationFrame);
      this.pendingAnimationFrame = null;
    }
    this.markerSignal.set(null);
    if (this.sceneRef && this.pointerObserver) {
      this.sceneRef.onPointerObservable.remove(this.pointerObserver);
    }
    if (this.sceneRef && this.beforeRenderObserver) {
      this.sceneRef.onBeforeRenderObservable.remove(this.beforeRenderObserver);
    }

    [this.marker, this.xzPickPlane, this.yzPickPlane, this.cubePickMesh].forEach((mesh) => {
      mesh?.dispose(false, true);
    });
  }

  private activePickMesh(): Mesh | null {
    const resultSet = this.resultSet();
    if (resultSet === 'XZPlane') {
      return this.xzPickPlane;
    }
    if (resultSet === 'YZPlane') {
      return this.yzPickPlane;
    }
    return this.cubePickMesh;
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
}
